import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const lane = (d, actors, steps, top = 60, gap = 34, dur = 8) => { const xs = actors.map((_, i) => 80 + i * 480 / Math.max(1, actors.length - 1)); actors.forEach(([s, kind], i) => { if (kind === 'phone') d.phone(xs[i] - 18, top - 10, 50); else if (kind === 'db') d.db(xs[i] - 30, top - 6, 60, 46); else d.server(xs[i] - 26, top - 8, 52, 50, { unit: 14 }); d.text(xs[i], top + 54, s, { cls: 'xs' }); d.line(xs[i], top + 64, xs[i], top + 76 + steps.length * gap, { stroke: C.line, dash: [3, 5], single: true }); }); steps.forEach(([a, b, s, hot], k) => { const y = top + 84 + k * gap, col = hot ? C.acc : C.ink2; if (a === b) { d.carrow([[xs[a], y - 6], [xs[a] + 40, y], [xs[a], y + 8]], { stroke: col, hl: 5 }); d.mono(xs[a] + 46, y, s, { size: 9, a: 'start', color: hot ? C.acc : undefined }); } else { d.arrow(xs[a], y, xs[b], y, { stroke: col, hl: 6 }); d.mono((xs[a] + xs[b]) / 2, y - 9, s, { size: 9, color: hot ? C.acc : undefined }); d.travel([[xs[a], y], [xs[b], y]], { dur, at: [k / steps.length, (k + 0.8) / steps.length], r: 3, color: col }); } }); };
export function where_sd_realtime(stage=99) { return systemMap("sd_realtime", ["Real-time requirements, ordering", "Polling and long polling", "SSE and WebSockets", "Connections, heartbeats, presence", "Pub/sub to WebSocket gateways", "Fan-out and slow consumers", "Reconnect and replay", "Client state and acknowledgements", "Case study: live score updates"], stage); }
export function cover_sd_realtime() { return systemCover("sd_realtime", 16, ["Real-time", "systems"], "Real-time systems", ["Real-time requirements, ordering", "Polling and long polling", "SSE and WebSockets", "Connections, heartbeats, presence", "Pub/sub to WebSocket gateways", "Fan-out and slow consumers", "Reconnect and replay", "Client state and acknowledgements", "Case study: live score updates"]); }
export function sd_realtime_promise() {
  const d = illustration('sd_realtime_promise', 'A COMMITTED SCORE IS NOT YET A SCORE ON SOMEONE\'S SCREEN', 300);
  const st = [['score commit', 'db'], ['event delivery', 'env'], ['client reducer', 'gear'], ['screen update', 'phone']];
  st.forEach(([s, k], i) => {
    const x = 30 + i * 150, hot = i === 3;
    if (k === 'db') d.db(x + 30, 60, 60, 60); if (k === 'env') d.envelope(x + 30, 74, 60, 36); if (k === 'gear') d.gear(x + 60, 92, 28, { spin: 5 }); if (k === 'phone') d.phone(x + 42, 54, 70, { stroke: C.acc });
    d.text(x + 60, 150, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    if (i < 3) d.arrow(x + 106, 92, x + 146, 92, { stroke: C.gray, hl: 5 });
  });
  d.travel([[90, 92], [540, 92]], { dur: 4, label: '121', w: 30 });
  d.text(320, 220, 'each stage can add delay or fail on its own', { cls: 'sm' });
  return d.svg();
}
export function sd_realtime_versions() {
  const d = illustration('sd_realtime_versions', 'EVENT ID SAYS WHICH EVENT; VERSION SAYS WHERE IT SITS; A LATE REPEAT IS IGNORED', 300);
  const r = [['id=a', 'v101', 'score 120', false], ['id=b', 'v102', 'score 121', false], ['id=a', 'v101', 'ignore: seen', true]];
  r.forEach(([id, v, p, hot], i) => {
    const y = 60 + i * 60;
    d.envelope(40, y, 70, 40, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 });
    chip(d, 140, y + 8, 80, id, false); chip(d, 240, y + 8, 80, v, false); d.text(350, y + 20, p, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 266, 'a late message is not a newer one', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_state_delta() {
const d=illustration('sd_realtime_state_delta','A SNAPSHOT REPLACES STATE; A DELTA NEEDS THE CORRECT PREDECESSOR',320);
  d.phone(60,70,138,{screen:C.accFaint});d.mono(96,124,'121',{size:23});d.text(159,103,'replacement',{cls:'ttl',a:'start'});d.mono(159,133,'version 102',{a:'start',size:11});
  d.phone(386,70,138);d.mono(422,124,'120',{size:23});d.text(479,103,'delta: +1',{cls:'ttl',a:'start',color:C.acc});d.mono(479,133,'after version 101',{a:'start',size:10});
  d.arrow(419,229,419,264,{stroke:C.acc});d.mono(475,275,'121 at v102',{size:12});
  d.text(320,301,'a skipped intermediate delta may require replay or a fresh snapshot',{cls:'sm'});return d.svg();
}
export function sd_realtime_latency() {
  const d = illustration('sd_realtime_latency', 'AN ILLUSTRATIVE 40 MS BUDGET FROM COMMIT TO SCREEN, SPENT STAGE BY STAGE', 280);
  const segs = [[5, 'validate'], [5, 'commit'], [5, 'publish'], [5, 'dispatch'], [15, 'network'], [5, 'apply']];
  const X = 40, W = 560, s = W / 40; let t = 0;
  segs.forEach(([v, n], i) => { const hot = i === 4; d.rect(X + t * s, 90, v * s, 40, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(X + (t + v / 2) * s, 110, n, { cls: 'xs' }); t += v; });
  ruler(d, X, 142, W, 40, 5, ' ms');
  d.text(320, 220, 'chosen durations; name where the clock starts and stops', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_poll() {
  const d = illustration('sd_realtime_poll', 'THE SCORE CHANGED AT 1 S; THE NEXT POLL AT 5 S SEES IT: 4 S LATE', 280);
  const X = 70, W = 500, s = W / 5;
  ruler(d, X, 170, W, 5, 1, ' s');
  [0, 5].forEach((t) => { d.phone(X + t * s - 12, 100, 44); d.arrow(X + t * s, 150, X + t * s, 166, { stroke: C.ink2, hl: 4 }); });
  d.pin(X + s, 160, { fill: C.accSoft, stroke: C.acc, label: 'score changes', dy: -60 });
  d.rect(X + s, 150, 4 * s, 12, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.text(X + 3 * s, 218, 'waits 4 s (mean over uniform changes: 2.5 s)', { cls: 'xs', color: C.acc });
  d.text(320, 256, 'empty checks in between still cost a request each', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_longpoll() {
  const d = illustration('sd_realtime_longpoll', 'A LONG POLL REGISTERS, RECHECKS, THEN WAITS, SO VERSION 102 CANNOT SLIP PAST', 330);
  lane(d, [['client', 'phone'], ['score service', 'srv'], ['wait registry', 'db']], [[0, 1, 'after v101'], [1, 2, 'register waiter'], [1, 2, 'recheck progress'], [2, 1, 'v102 ready', true], [1, 0, 'respond, repeat', true]]);
  return d.svg();
}
export function sd_realtime_pollrace() {
  const d = illustration('sd_realtime_pollrace', 'THE SLOW OLD RESPONSE ARRIVES LAST; THE VERSION CHECK REJECTS IT', 300);
  lane(d, [['client', 'phone'], ['slow request', 'srv'], ['fast request', 'srv']], [[0, 1, 'request A'], [0, 2, 'request B'], [2, 0, 'v102: apply'], [1, 0, 'v101: reject', true]]);
  return d.svg();
}
export function sd_realtime_push() {
  const d = illustration('sd_realtime_push', 'POLLING: 10,000 CHECKS/S. PUSHING EVERY EVENT: 1,000,000 DELIVERIES/S', 320);
  panel(d, 20, 44, 292, 230, 'poll every 5 s');
  for (let i = 0; i < 6; i++) d.phone(40 + i * 40, 80, 34, { stroke: C.gray });
  for (let k = 0; k < 3; k++) d.travel([[60 + k * 80, 120], [166, 180]], { dur: 3, at: [k / 3, k / 3 + 0.4], r: 3, color: C.ink2 });
  d.server(140, 170, 52, 50, { unit: 14 });
  d.mono(166, 240, '10,000 checks/s · 20,000,000 B/s', { size: 9 });
  panel(d, 328, 44, 292, 230, 'push every event', true);
  d.server(448, 80, 52, 50, { unit: 14, led: () => true });
  for (let i = 0; i < 6; i++) { d.phone(348 + i * 40, 170, 34, { stroke: C.gray }); d.travel([[474, 130], [365 + i * 40, 170]], { dur: 1.2, at: [i / 8, i / 8 + 0.5], r: 2.5 }); }
  d.mono(474, 240, '1,000,000/s · 200,000,000 B/s', { size: 9, color: C.acc });
  d.text(320, 300, 'compare equal product promises: latest state vs every event', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_sse() {
  const d = illustration('sd_realtime_sse', 'ONE SSE EVENT: id, event, data, THEN A BLANK LINE THAT DISPATCHES IT', 300);
  d.rect(140, 60, 360, 150, { r: 6, fill: C.paper, stroke: C.ink2 });
  [['id: 102', 'identity'], ['event: score', 'type'], ['data: {"score":121}', 'payload'], ['', 'blank line → dispatch']].forEach(([l, s], i) => {
    const y = 84 + i * 32, hot = i === 3;
    if (l) d.mono(160, y, l, { size: 11, a: 'start' }); else d.line(160, y, 300, y, { stroke: C.acc, dash: [3, 3], single: true });
    d.text(520, y, s, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 250, 'on reconnect the browser sends Last-Event-ID: 102', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_websocket() {
  const d = illustration('sd_realtime_websocket', 'ONE HANDSHAKE, THEN FRAMED MESSAGES BOTH WAYS; THE ACK IS AN APP CHOICE', 330);
  lane(d, [['client', 'phone'], ['gateway', 'srv']], [[0, 1, 'GET Upgrade: websocket'], [1, 0, '101 Switching'], [0, 1, 'subscribe m7'], [1, 0, 'score v102'], [0, 1, 'app ack 102', true]]);
  return d.svg();
}
export function sd_realtime_frames() {
  const d = illustration('sd_realtime_frames', 'A 200 B MESSAGE IS 204 B FROM THE SERVER AND 208 B FROM THE CLIENT (MASK KEY)', 280);
  const row = (y, s, hdr, hot) => { d.text(40, y + 16, s, { cls: 'ttl', a: 'start', size: 12 }); d.rect(180, y, hdr * 8, 32, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(180 + hdr * 4, y + 16, `${hdr}`, { size: 9 }); d.rect(180 + hdr * 8, y, 200, 32, { r: 0, fill: C.paper, stroke: C.ink2 }); d.mono(180 + hdr * 8 + 100, y + 16, '200 payload', { size: 9.5 }); d.mono(180 + hdr * 8 + 214, y + 16, `${200 + hdr} B`, { size: 11, a: 'start', color: hot ? C.acc : undefined }); };
  row(70, 'server → client', 4, false); row(130, 'client → server', 8, true);
  d.text(320, 220, 'TLS, TCP and IP bytes are not included', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_subscription() {
  const d = illustration('sd_realtime_subscription', 'A CONNECTED PEER IS NOT YET A SUBSCRIBER: CHECK THE TOPIC AND THE PERMISSION FIRST', 300);
  const st = [['authenticate', 'who is it?'], ['validate topic', 'match:m7 exists'], ['check permission', 'may watch m7?'], ['register', 'add to delivery set']];
  st.forEach(([a, b], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.rect(x, 80, 120, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 102, a, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 124, b, { cls: 'xs' });
    if (i < 3) d.arrow(x + 124, 112, x + 146, 112, { stroke: C.gray, hl: 5 });
  });
  d.travel([[90, 112], [540, 112]], { dur: 4, r: 4 });
  return d.svg();
}
export function sd_realtime_gateways() {
  const d = illustration('sd_realtime_gateways', '50,000 VIEWERS ÷ 10,000 PER GATEWAY = 5 GATEWAYS, EACH OWNING ITS SOCKETS', 320);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) d.phone(30 + c * 24, 50 + r * 46, 34, { stroke: C.gray });
  d.text(90, 290, 'each phone = 2,000', { cls: 'xs' });
  ['A', 'B', 'C', 'D', 'E'].forEach((s, i) => { const y = 46 + i * 52; d.server(420, y, 64, 42, { unit: 13, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(500, y + 21, `${s}: 10,000`, { size: 10, a: 'start' }); d.line(160, 50 + i * 46 + 16, 414, y + 21, { stroke: C.line, single: true }); });
  return d.svg();
}
export function sd_realtime_heartbeat() {
  const d = illustration('sd_realtime_heartbeat', 'PING, PONG, PING, SILENCE: THE GATEWAY\'S DEADLINE DECIDES "GONE"', 300);
  const X = 60, W = 520;
  d.server(20, 70, 40, 50, { unit: 13 }); d.phone(590, 70, 46);
  d.text(40, 136, 'gateway', { cls: 'xs' }); d.text(602, 130, 'viewer', { cls: 'xs' });
  [[0, true], [1, true], [2, false]].forEach(([k, ok]) => { const x = X + 40 + k * 150; d.arrow(x, 80, x + 80, 80, { stroke: C.ink2, hl: 5 }); d.mono(x + 40, 70, 'ping', { size: 9 }); if (ok) { d.arrow(x + 80, 110, x, 110, { stroke: C.ink2, hl: 5 }); d.mono(x + 40, 124, 'pong', { size: 9 }); } });
  d.clock(X + 420, 110, 40, { spin: 3 }); d.text(X + 420, 150, 'deadline passes', { cls: 'xs', color: C.acc });
  d.text(320, 220, 'a local decision from missing evidence, not a message saying "I died"', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_drain() {
  const d = illustration('sd_realtime_drain', 'DRAINING A GATEWAY: STOP NEW SOCKETS, WARN, JITTER THE RECONNECTS, CLOSE BY A DEADLINE', 300);
  const st = [['remove admissions', 'no new sockets'], ['notify clients', '"reconnect soon"'], ['jitter reconnects', 'spread over time'], ['close by deadline', 'cursor saved']];
  st.forEach(([a, b], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.rect(x, 80, 120, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 102, a, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x + 60, 124, b, { cls: 'xs' });
    if (i < 3) d.arrow(x + 124, 112, x + 146, 112, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 210, 'a restart is a traffic event: plan its reconnect wave', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_presence() {
  const d = illustration('sd_realtime_presence', 'RENEW AT 0 AND 30 WITH A 90 S LEASE; THE LINK DIES AT 60, "ONLINE" ENDS AT 120', 280);
  const X = 60, W = 520, s = W / 120;
  ruler(d, X, 170, W, 120, 30, ' s');
  d.rect(X, 90, 90 * s, 22, { r: 2, fill: C.card, stroke: C.ink2 }); d.rect(X + 30 * s, 120, 90 * s, 22, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.pin(X, 86, { label: 'renew', dy: -34 }); d.pin(X + 30 * s, 116, { label: 'renew', dy: -64 });
  bolt(d, X + 60 * s, 62, 0.7); d.text(X + 60 * s, 52, 'link lost', { cls: 'xs' });
  d.text(X + 120 * s, 202, 'shown offline', { cls: 'xs', color: C.acc, a: 'end' });
  d.text(320, 250, '"online" is a declared observation with a staleness bound', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_pubsub() {
const d=illustration('sd_realtime_pubsub','GATEWAYS FAN OUT THE DURABLE EVENT TO THEIR LOCAL CONNECTIONS',370);
  d.db(32,140,91,103,{under:'durable score'});figShelf(d,191,163,['event','event'],{width:178,height:44,hot:1});
  d.arrow(130,185,183,185,{stroke:C.acc});
  [78,257].forEach((y,i)=>{d.server(431,y,68,57,{label:`gateway ${i?'B':'A'}`,unit:16});d.arrow(377,185,423,y+29,{stroke:C.ink2,hl:5});[0,1].forEach(j=>{d.phone(558,y-27+j*67,45);d.arrow(506,y+27,551,y+j*67-4,{stroke:C.acc,hl:4});});});
  d.text(320,343,'scoring remains independent of the lifetime of viewer sockets',{cls:'sm'});return d.svg();
}
export function sd_realtime_interests() {
  const d = illustration('sd_realtime_interests', 'EACH MATCH IS SENT ONLY TO GATEWAYS WITH A VIEWER WATCHING IT', 320);
  const m = ['red', 'blue', 'green'], g = ['A', 'B', 'C'], has = [[1, 1, 0], [0, 1, 0], [0, 0, 1]];
  m.forEach((s, i) => { d.envelope(40, 66 + i * 80, 70, 40); d.text(75, 122 + i * 80, `match ${s}`, { cls: 'xs' }); });
  g.forEach((s, j) => d.server(470, 56 + j * 80, 60, 60, { unit: 14, label: `gateway ${s}` }));
  has.forEach((row, i) => row.forEach((v, j) => { if (v) d.line(116, 86 + i * 80, 464, 86 + j * 80, { stroke: i === 0 ? C.acc : C.ink2, single: true, sw: i === 0 ? 1.6 : 1 }); }));
  d.travel([[116, 86], [464, 86]], { dur: 3, r: 3 }); d.travel([[116, 86], [464, 166]], { dur: 3, r: 3 });
  d.text(320, 304, 'interests change mid-match; the registry must expire dead gateways', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_partition_order() {
  const d = illustration('sd_realtime_partition_order', 'ONE PARTITION KEEPS MATCH RED IN ORDER; THEN EVERY INTERESTED GATEWAY GETS A COPY', 300);
  d.tape(40, 100, ['r1', 'r2', 'r3', 'r4'], { cw: 40, h: 30, hot: () => true }); d.text(120, 86, 'partition: match red', { cls: 'xs' });
  d.server(260, 86, 70, 60, { unit: 14, label: 'one processor' });
  d.arrow(204, 115, 254, 115, { stroke: C.acc, hl: 6 });
  ['A', 'B', 'C'].forEach((s, i) => { d.server(480, 50 + i * 70, 56, 50, { unit: 13 }); d.text(560, 75 + i * 70, `gateway ${s}`, { cls: 'xs', a: 'start' }); d.arrow(336, 115, 474, 75 + i * 70, { stroke: C.ink2, hl: 6 }); });
  d.text(320, 270, 'a consumer group divides work; it is not a broadcast', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_race() {
  const d = illustration('sd_realtime_race', 'SUBSCRIBE FIRST, FETCH SNAPSHOT v101, THEN APPLY ONLY EVENTS AFTER 101', 330);
  lane(d, [['client', 'phone'], ['snapshot API', 'srv'], ['event log', 'db']], [[0, 2, 'open replay cursor'], [0, 1, 'fetch snapshot'], [2, 0, 'v102 buffered'], [1, 0, 'snapshot v101'], [0, 0, 'apply > 101', true]]);
  return d.svg();
}
export function sd_realtime_fanout() {
  const d = illustration('sd_realtime_fanout', '20 EVENTS/S × 200 B: 20,000 B/S TO GATEWAYS, 200,000,000 B/S TO VIEWERS', 320);
  d.server(40, 120, 60, 70, { unit: 15, label: 'broker' });
  ['A', 'B', 'C', 'D', 'E'].forEach((s, i) => { const y = 50 + i * 52; d.line(106, 155, 250, y + 18, { stroke: C.ink2, single: true, sw: 0.8 }); d.server(256, y, 46, 38, { unit: 12 }); for (let k = 0; k < 6; k++) d.line(306, y + 19, 450, y - 6 + k * 10, { stroke: C.acc, single: true, sw: 0.6 }); });
  d.mono(176, 300, '20,000 B/s', { size: 10 });
  d.rect(456, 40, 150, 260, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(531, 160, '50,000\nviewers', { cls: 'sm', vc: true, color: C.acc });
  d.mono(531, 214, '200,000,000 B/s', { size: 10, color: C.acc }); d.mono(531, 234, '(one gateway: 40,000,000)', { size: 8.5 });
  d.travel([[106, 155], [256, 69], [450, 60]], { dur: 2.5, r: 3 });
  return d.svg();
}
export function sd_realtime_batch() {
  const d = illustration('sd_realtime_batch', 'BATCH 5 EVENTS INTO ONE 1,000 B MESSAGE; THE FIRST ONE WAITS 0.2 S', 280);
  const X = 80, W = 400, s = W / 0.25;
  ruler(d, X, 170, W, 0.25, 0.05, ' s');
  [0, 0.05, 0.1, 0.15, 0.2].forEach((t, i) => d.envelope(X + t * s - 9, 110 - (i === 0 ? 0 : 0), 18, 13, { fill: i === 0 ? C.accSoft : C.paper, stroke: i === 0 ? C.acc : C.ink2 }));
  d.brace(X, X + 0.2 * s, 132, { label: 'first event waits 4 ÷ 20 s = 0.2 s' });
  d.rect(X + 0.2 * s + 20, 96, 90, 40, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(X + 0.2 * s + 65, 116, '5 × 200 B', { cls: 'xs' });
  d.text(320, 236, 'fewer frames, same payload; a flush timer bounds quiet periods', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_slow() {
const d=illustration('sd_realtime_slow','A SLOW RECIPIENT FILLS ITS BOUNDED OUTPUT BUFFER',330);
  d.server(39,82,85,102,{label:'gateway'});d.phone(535,91,95,{label:'slow viewer'});
  d.arrow(133,126,225,126,{stroke:C.acc});d.mono(179,100,'4,000 B/s',{size:11});
  d.rect(233,96,227,102,{r:1,fill:C.paper,stroke:C.ink2});d.fillRect(235,138,223,58,C.accSoft);d.text(346,121,'60,000 B buffer',{cls:'ttl'});
  d.arrow(469,145,525,145,{stroke:C.ink2});d.mono(497,211,'1,000 B/s',{size:11});
  d.mono(320,262,'4,000 − 1,000 = 3,000 B/s growth',{size:13});d.mono(320,298,'60,000 ÷ 3,000 = 20 s until full',{size:13});return d.svg();
}
export function sd_realtime_topics() {
  const d = illustration('sd_realtime_topics', 'THREE MATCHES, VERY UNEQUAL WORK: 600,000 vs 300,000 vs 100,000 DELIVERIES/S', 300);
  [['30,000 viewers', 600000], ['15,000 viewers', 300000], ['5,000 viewers', 100000]].forEach(([s, v], i) => {
    const y = 60 + i * 66, hot = i === 0;
    d.envelope(40, y, 50, 32, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 });
    d.text(110, y + 16, s, { cls: 'sm', a: 'start' });
    d.rect(250, y + 2, v / 2000, 28, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(250 + v / 2000 + 8, y + 16, v.toLocaleString('en-US'), { size: 10, a: 'start' });
  });
  d.text(320, 270, '20 events/s each; together still 1,000,000 deliveries/s; route by work', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_replay() {
const d=illustration('sd_realtime_replay','RECONNECT REPLAYS THE RETAINED GAP AFTER APPLIED PROGRESS',340);
  for(let r=0;r<4;r++)for(let c=0;c<25;c++)d.rect(43+c*22,67+r*31,17,23,{r:0,fill:C.accFaint,stroke:C.line,sw:.5});
  d.brace(43,591,213,{label:'5 s × 20 events/s = 100 missing events'});
  d.phone(54,256,59,{screen:C.accFaint});d.arrow(204,279,104,279,{stroke:C.acc});d.mono(447,273,'100 × 200 B = 20,000 B',{size:13});d.text(447,302,'payload to replay',{cls:'sm'});return d.svg();
}
export function sd_realtime_retention() {
  const d = illustration('sd_realtime_retention', 'THE CLIENT\'S CURSOR IS OLDER THAN THE OLDEST RETAINED EVENT', 280);
  const X = 60, W = 520, s = W / 60;
  d.rect(X, 100, 30 * s, 34, { r: 0, fill: C.paper, stroke: C.gray, dash: [4, 3] }); d.text(X + 15 * s, 117, 'expired', { cls: 'xs', color: C.gray });
  d.rect(X + 30 * s, 100, 30 * s, 34, { r: 0, fill: C.card, stroke: C.ink2 }); d.text(X + 45 * s, 117, 'retained', { cls: 'xs' });
  d.pin(X, 96, { label: 'old cursor', dy: -34, fill: C.accSoft, stroke: C.acc });
  d.pin(X + W, 96, { label: 'head', dy: -34 });
  d.text(320, 190, 'answer "cursor too old" and send a fresh versioned snapshot', { cls: 'sm', color: C.acc });
  d.text(320, 214, 'positions are logical and illustrative', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_snapshot_tail() {
  const d = illustration('sd_realtime_snapshot_tail', 'REPLACE THE BASE WITH SNAPSHOT v200, THEN APPLY v201, v202 IN ORDER', 330);
  lane(d, [['client', 'phone'], ['source', 'srv'], ['replay log', 'db']], [[0, 1, 'request state'], [1, 0, 'snapshot v200'], [0, 2, 'events after v200'], [2, 0, 'v201, v202'], [0, 0, 'apply tail', true]]);
  return d.svg();
}
export function sd_realtime_reconnect() {
  const d = illustration('sd_realtime_reconnect', '50,000 RECONNECTS AT ONCE, OR SPREAD OVER 10 S: ABOUT 5,000/S PLUS AN ADMISSION LIMIT', 320);
  panel(d, 20, 44, 292, 230, 'no spreading');
  d.rect(40, 80, 30, 150, { r: 2, fill: C.accSoft, stroke: C.acc }); d.mono(55, 244, '50,000', { size: 9 });
  d.text(180, 150, 'one correlated wave', { cls: 'sm' });
  panel(d, 328, 44, 292, 230, '10 s jittered window', true);
  [92, 108, 97, 103, 99, 95, 110, 101, 94, 101].forEach((v, i) => d.rect(350 + i * 26, 230 - v * 0.6, 20, v * 0.6, { r: 1, fill: C.card, stroke: C.ink2 }));
  d.line(345, 230 - 60, 610, 230 - 60, { stroke: C.acc, dash: [4, 3], single: true }); d.text(474, 156, 'expected 5,000/s', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'random spread still has peaks: keep a hard admission limit too', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_reducer() {
  const d = illustration('sd_realtime_reducer', 'ARRIVE 101, 102, 102, 104, 103 → APPLY 101, 102, 103, 104', 300);
  d.text(40, 76, 'arrives', { cls: 'xs', a: 'start' }); d.tape(130, 60, ['101', '102', '102', '104', '103'], { cw: 70, h: 30, hot: (i) => i === 2 || i === 3 });
  d.text(40, 136, 'action', { cls: 'xs', a: 'start' });
  ['apply', 'apply', 'ignore dup', 'hold', 'apply, release'].forEach((s, i) => d.mono(165 + i * 70, 136, s, { size: 8.5, color: i === 2 || i === 3 ? C.acc : undefined }));
  d.text(40, 196, 'applied', { cls: 'xs', a: 'start' }); d.tape(130, 180, ['101', '102', '103', '104'], { cw: 70, h: 30 });
  d.text(320, 256, 'dedupe by event id; order by predecessor version', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_ack() {
  const d = illustration('sd_realtime_ack', 'THE CLIENT ACKS "APPLIED 102", SO THE GATEWAY CAN RELEASE ITS BUFFER UP TO 102', 300);
  lane(d, [['gateway', 'srv'], ['client', 'phone']], [[0, 1, 'event 102'], [1, 1, 'parse + apply'], [1, 0, 'ack applied 102', true], [0, 0, 'release ≤ 102']]);
  return d.svg();
}
export function sd_realtime_command() {
  const d = illustration('sd_realtime_command', 'A COMMAND ASKS; THE SERVICE COMMITS ONCE; THE EVENT REPORTS WHAT HAPPENED', 300);
  const st = [['command + op id', 'scorer intent'], ['authorize + validate', 'may she?'], ['commit once', 'op id unique'], ['event + version', 'v102 published']];
  st.forEach(([a, b], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.rect(x, 80, 120, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 102, a, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x + 60, 124, b, { cls: 'xs' });
    if (i < 3) d.arrow(x + 124, 112, x + 146, 112, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 210, 'idempotency lives at the authoritative effect, not at the gateway', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_correction() {
  const d = illustration('sd_realtime_correction', 'CORRECTION c AT v103 REFERS BACK TO a AT v101, BUT IT IS STILL THE NEWEST EVENT', 280);
  d.tape(120, 90, ['v101: a, +1', 'v102: b', 'v103: c reverses a'], { cw: 140, h: 34, hot: (i) => i === 2 });
  d.carrow([[470, 88], [330, 50], [190, 88]], { stroke: C.acc, dash: [4, 3] }); d.text(330, 44, 'refers to', { cls: 'xs', color: C.acc });
  d.arrow(120, 150, 540, 150, { stroke: C.gray }); d.text(330, 168, 'stream order', { cls: 'xs' });
  d.text(320, 230, 'reference is not order; the log keeps both facts', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_full() {
  const d = illustration('sd_realtime_full', 'ONE ACCEPTED COMMAND BECOMES MANY SCREEN UPDATES', 300);
  const st = [['score + outbox', 'db'], ['retained event', 'tape'], ['interested gateways', 'srv'], ['versioned reducers', 'phones']];
  st.forEach(([s, k], i) => {
    const x = 30 + i * 150, hot = i === 3;
    if (k === 'db') d.db(x + 30, 60, 60, 60); if (k === 'tape') d.tape(x + 14, 76, ['', '', ''], { cw: 30, h: 26, hot: (j) => j === 2 }); if (k === 'srv') { d.server(x + 20, 62, 36, 50, { unit: 13 }); d.server(x + 64, 62, 36, 50, { unit: 13 }); } if (k === 'phones') for (let j = 0; j < 4; j++) d.phone(x + 14 + j * 24, 66, 40, { stroke: C.acc });
    d.text(x + 60, 140, s, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined });
    if (i < 3) d.arrow(x + 114, 90, x + 146, 90, { stroke: C.gray, hl: 5 });
  });
  d.travel([[90, 90], [540, 90]], { dur: 4, label: 'v102', w: 34 });
  d.text(320, 210, 'state, history, sockets and screens each have their own owner', { cls: 'xs' });
  return d.svg();
}
export function sd_realtime_totals() {
  const d = illustration('sd_realtime_totals', 'EVERY MULTIPLIER IN THE FAN-OUT, FROM 20 EVENTS/S TO 1,000,000 DELIVERIES/S', 300);
  const r = [['producer', '20 events/s × 200 B', '4,000 B/s'], ['broker → 5 gateways', '20 × 5', '100 deliveries/s'], ['one gateway', '20 × 10,000', '200,000 deliveries/s'], ['all viewers', '20 × 50,000', '1,000,000 deliveries/s']];
  r.forEach(([a, b, c], i) => {
    const y = 56 + i * 52, hot = i === 3;
    d.text(40, y + 14, a, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.mono(300, y + 14, b, { size: 10 });
    d.mono(600, y + 14, c, { size: 10.5, a: 'end', color: hot ? C.acc : undefined });
    if (i < 3) d.arrow(80, y + 26, 80, y + 44, { stroke: C.gray, hl: 4 });
  });
  return d.svg();
}
export function sd_realtime_failure() {
  const d = illustration('sd_realtime_failure', 'GATEWAY A DIES; THE VIEWER RECONNECTS TO B AND REPLAYS FROM v101 OUT OF THE STORE', 330);
  lane(d, [['viewer', 'phone'], ['new gateway', 'srv'], ['event store', 'db']], [[0, 1, 'reconnect after v101'], [1, 2, 'authorize + replay'], [2, 1, 'v102 onward'], [1, 0, 'catch-up, then live', true], [0, 1, 'ack contiguous']]);
  return d.svg();
}
export function sd_realtime_contract() {
  const d = illustration('sd_realtime_contract', 'FOUR FAILURES, HOW EACH IS DETECTED, AND WHAT HAPPENS NEXT', 320);
  const r = [['duplicate', 'same event id', 'ignore the repeat'], ['gap', 'version jumps', 'replay the suffix'], ['old cursor', 'before retention', 'snapshot + tail'], ['slow client', 'queue limit hit', 'coalesce or close']];
  r.forEach(([a, b, c], i) => {
    const y = 56 + i * 58, hot = i === 3;
    chip(d, 30, y, 140, a, hot, 30);
    d.arrow(176, y + 15, 204, y + 15, { stroke: C.gray, hl: 5 }); d.text(214, y + 15, b, { cls: 'sm', a: 'start' });
    d.arrow(380, y + 15, 408, y + 15, { stroke: C.gray, hl: 5 }); d.text(418, y + 15, c, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 300, 'coalescing is allowed only for replaceable state, never for deltas', { cls: 'xs' });
  return d.svg();
}

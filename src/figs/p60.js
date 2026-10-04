import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
export function where_sd_networking(stage=99) { return systemMap("sd_networking", ["DNS, TCP and UDP", "HTTP versions and TLS", "REST, gRPC, WebSockets and SSE", "Proxies, L4/L7 and connection pools", "Timeouts, retries and backoff", "Idempotency, polling and push", "Case study: one request end to end"], stage); }
export function cover_sd_networking() { return systemCover("sd_networking", 1, ["Networking", "fundamentals"], "Networking fundamentals", ["DNS, TCP and UDP", "HTTP versions and TLS", "REST, gRPC, WebSockets and SSE", "Proxies, L4/L7 and connection pools", "Timeouts, retries and backoff", "Idempotency, polling and push", "Case study: one request end to end"]); }
export function sd_dns_path() {
  const d = illustration('sd_dns_path', 'A CACHED ANSWER AT THE RECURSIVE RESOLVER ENDS THE WALK EARLY', 340);
  d.laptop(28, 128, 90, { label: 'stub resolver' });
  d.server(214, 104, 92, 104, { label: 'recursive resolver', led: () => true });
  d.text(260, 238, 'cache', { cls: 'xs' });
  chip(d, 196, 248, 128, 'scores.heron → A', true);
  [['root', 64], ['top-level domain', 146], ['zone authority', 228]].forEach(([s, y]) => {
    d.server(500, y, 64, 48, { unit: 14, fill: C.paper, stroke: C.gray });
    d.text(532, y + 62, s, { cls: 'xs' });
    d.arrow(312, 156, 492, y + 24, { stroke: C.line, dash: [4, 5], hl: 6 });
  });
  d.text(404, 52, 'skipped on a hit', { cls: 'sm', color: C.gray });
  d.arrow(124, 150, 206, 150, { stroke: C.ink2 });
  d.carrow([[214, 180], [170, 196], [124, 176]], { stroke: C.acc });
  d.travel([[124, 150], [206, 150], [260, 248], [214, 180], [124, 172]], { dur: 5, label: 'A?', w: 30 });
  d.glow((g) => g.rect(196, 248, 128, 22, { r: 4, stroke: C.acc }));
  d.hand(250, 312, 'a miss walks right; a hit answers here', { size: 16 });
  return d.svg();
}
export function sd_transport_order() {
  const d = illustration('sd_transport_order', 'B IS LOST, SO C WAITS IN THE RECEIVE BUFFER UNTIL B IS RESENT', 330);
  d.server(28, 100, 72, 92, { label: 'sender' });
  d.server(540, 100, 72, 92, { label: 'receiver' });
  pipe(d, 108, 532, 146, 30);
  [['A', 0, [0, 0.35]], ['B', 1, [0.05, 0.25]], ['C', 2, [0.1, 0.45]]].forEach(([s, i, at]) => {
    const end = s === 'B' ? 300 : 520;
    d.travel([[120, 146], [end, 146]], { at, dur: 8, label: s, w: 24, fill: s === 'B' ? C.accSoft : C.card, color: s === 'B' ? C.acc : C.ink2 });
  });
  cross(d, 312, 146, 9);
  d.text(312, 118, 'B dropped', { cls: 'sm', color: C.acc });
  d.travel([[120, 160], [520, 160]], { at: [0.55, 0.8], dur: 8, label: 'B again', w: 50 });
  d.text(320, 186, 'retransmission', { cls: 'xs' });
  d.text(320, 224, 'receive buffer', { cls: 'ttl' });
  d.tape(232, 240, ['A', '', 'C'], { cw: 58, h: 30, hot: (i) => i === 1 });
  d.text(320, 286, 'the gap at B holds C back', { cls: 'sm' });
  d.arrow(420, 255, 530, 255, { stroke: C.ink2 });
  d.text(475, 240, 'app reads A', { cls: 'xs' });
  d.during([0.82, 1], (g) => g.text(475, 272, 'then B, C', { cls: 'xs', color: C.acc }), { dur: 8 });
  return d.svg();
}
export function sd_http_versions() { return systemFigure("sd_http_versions", "HTTP SEMANTICS, DIFFERENT TRANSPORTS", "rows", [["HTTP/1.1", "messages", "TCP"], ["HTTP/2", "frames", "TCP"], ["HTTP/3", "frames", "QUIC"]], "same resource, different connection mechanics"); }
export function sd_http_streams() {
const d=illustration('sd_http_streams','MULTIPLEXING INTERLEAVES FRAMES ON ONE CONNECTION',310);
  d.text(36,47,'ordered responses',{cls:'ttl',a:'start'});figShelf(d,37,76,['A body','A body','A body','B waits'],{width:567,hot:3,height:43});
  d.text(36,169,'multiplexed frames',{cls:'ttl',a:'start'});figShelf(d,37,200,['A','B','A','B','A','B'],{width:567,hot:1,height:43});
  d.arrow(48,260,593,260,{stroke:C.ink2});d.text(320,287,'HTTP streams differ; TCP can still hold bytes behind a transport gap',{cls:'sm'});return d.svg();
}
export function sd_tls_sequence() {
  const d = illustration('sd_tls_sequence', 'A COLD READ SPENDS 120 OF ITS 160 MS PREPARING', 350);
  d.laptop(24, 60, 80, { label: 'viewer' });
  d.server(300, 52, 58, 66, { unit: 16, label: 'resolver' });
  d.server(548, 52, 66, 74, { unit: 16, label: 'server' });
  const steps = [['DNS answer', 300, 0], ['TCP setup', 548, 0], ['TLS setup', 548, 0], ['HTTP exchange', 548, 1]];
  steps.forEach(([s, x, hot], i) => {
    const y = 156 + i * 30;
    d.arrow(104, y, x + 20, y, { stroke: hot ? C.acc : C.ink2, hl: 6 });
    d.arrow(x + 20, y + 10, 104, y + 10, { stroke: hot ? C.acc : C.gray, hl: 6 });
    d.text(116, y - 6, `${s}: 40 ms`, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined });
    d.travel([[104, y], [x + 20, y], [x + 20, y + 10], [104, y + 10]], { at: [i / 4, (i + 1) / 4], dur: 8, r: 3.5, color: hot ? C.acc : C.ink2 });
  });
  const X = 40, W = 560;
  [0, 1, 2, 3].forEach((i) => d.rect(X + i * W / 4, 296, W / 4, 22, { r: 0, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }));
  ['DNS', 'TCP', 'TLS', 'HTTP'].forEach((s, i) => d.mono(X + i * W / 4 + W / 8, 307, s, { size: 10 }));
  ruler(d, X, 322, W, 160, 40, ' ms');
  return d.svg();
}
export function sd_api_contracts() { return systemFigure("sd_api_contracts", "RESOURCE VERSUS REMOTE METHOD", "split", [["REST-style resource", "GET /matches/m7\nrepresentation of a match"], ["gRPC method", "ScoreService.GetMatch\ntyped request and result"]], "the contract comes before the encoding"); }
export function sd_live_protocols() { return systemFigure("sd_live_protocols", "WHO NEEDS TO SEND MESSAGES?", "split", [["SSE", "server -> viewer\nHTTP event stream"], ["WebSocket", "viewer <-> server\nmessage channel"]], "replay is an application responsibility"); }
export function sd_proxy_layers() {
  const d = illustration('sd_proxy_layers', 'L4 READS THE OUTSIDE OF THE ENVELOPE; L7 OPENS IT', 350);
  d.rect(170, 60, 300, 178, { r: 4, fill: C.card, stroke: C.ink2 });
  d.text(186, 82, 'IP + TCP header', { cls: 'ttl', a: 'start' });
  d.mono(186, 104, '203.0.113.9 : 443', { a: 'start', size: 11 });
  d.rect(196, 124, 248, 98, { r: 4, fill: C.accFaint, stroke: C.acc, dash: [5, 4] });
  d.lock(206, 132, 22, { stroke: C.acc, fill: C.accSoft });
  d.text(236, 144, 'inside TLS', { cls: 'sm', a: 'start', color: C.acc });
  d.mono(214, 176, 'GET /matches/m7', { a: 'start', size: 11 });
  d.mono(214, 198, 'Host: scores.heron.test', { a: 'start', size: 10 });
  d.router(30, 118, 92, { label: 'L4 balancer' });
  d.arrow(126, 104, 180, 104, { stroke: C.ink2 });
  d.text(76, 190, 'sees address\nand port only', { cls: 'sm', vc: true });
  d.server(540, 110, 74, 84, { label: 'L7 proxy', fill: C.accSoft, stroke: C.acc });
  d.arrow(532, 176, 452, 176, { stroke: C.acc });
  d.text(577, 230, 'terminates TLS,\nreads path', { cls: 'sm', vc: true });
  chip(d, 186, 270, 120, '/matches → score', true);
  chip(d, 334, 270, 120, '/clips → media');
  d.arrow(320, 240, 246, 266, { stroke: C.acc, hl: 6 });
  d.text(320, 320, 'routing by path needs a hop that holds the plaintext', { cls: 'sm' });
  return d.svg();
}
export function sd_connection_pool() {
  const d = illustration('sd_connection_pool', 'A POOL LENDS A FIXED SET OF CONNECTIONS; EXTRA CALLERS WAIT', 340);
  [0, 1, 2].forEach((i) => d.person(40 + i * 30, 70, 26));
  d.text(70, 116, 'waiting callers', { cls: 'xs' });
  d.arrow(122, 82, 168, 120, { stroke: C.gray, dash: [4, 4] });
  panel(d, 170, 52, 220, 200, 'pool: 4 loans');
  [0, 1, 2, 3].forEach((i) => {
    const y = 92 + i * 38, busy = i < 3;
    pipe(d, 230, 390, y, 14, busy);
    d.person(198, y - 13, 24, { fill: busy ? C.accSoft : C.card, stroke: busy ? C.acc : C.gray });
    if (busy) d.travel([[236, y], [384, y]], { dur: 2 + i * 0.6, r: 3 });
    d.mono(372, y - 14, busy ? 'in use' : 'free', { size: 9, a: 'end', color: busy ? C.acc : C.gray });
  });
  d.db(470, 86, 120, 130, { label: 'database', under: 'CPU, locks, I/O' });
  d.arrow(392, 150, 462, 150, { stroke: C.ink2 });
  d.text(280, 278, '5 app instances × 20-slot pools = 100 loans at the database', { cls: 'sm' });
  d.hand(470, 312, 'the pool does not make the database bigger', { size: 15 });
  return d.svg();
}
export function sd_deadline_budget() { return systemFigure("sd_deadline_budget", "ILLUSTRATIVE 500 MS REQUEST BUDGET", "bars", [["network", 40, "ms"], ["response reserve", 60, "ms"], ["application", 400, "ms"]], "downstream calls inherit the remaining time"); }
export function sd_retry_amplification() {
  const d = illustration('sd_retry_amplification', 'THREE ATTEMPTS AT EACH OF THREE LAYERS: 1 → 3 → 9 → 27', 360);
  const cols = [['original', 1, 1000], ['gateway', 3, 3000], ['service', 9, 9000], ['database', 27, 27000]];
  const pos = cols.map(([, n], c) => Array.from({ length: n }, (_, i) => [70 + c * 168, 64 + (i + 0.5) * 230 / n]));
  pos.slice(1).forEach((col, c) => col.forEach((p, i) => d.line(pos[c][Math.floor(i / 3)][0] + 6, pos[c][Math.floor(i / 3)][1], p[0] - 6, p[1], { stroke: c === 2 ? C.acc : C.line, single: true, sw: 0.8 })));
  pos.forEach((col, c) => col.forEach(([x, y]) => d.circle(x, y, c === 3 ? 7 : 12, { fill: c === 3 ? C.accSoft : C.card, stroke: c === 3 ? C.acc : C.ink2 })));
  cols.forEach(([s, n, rate], c) => { d.text(70 + c * 168, 316, s, { cls: 'ttl' }); d.mono(70 + c * 168, 338, `${rate.toLocaleString('en-US')}/s`, { size: 10, color: c === 3 ? C.acc : undefined }); });
  d.travel([pos[0][0], pos[1][2], pos[2][8], pos[3][26]], { dur: 4, r: 3.5 });
  d.hand(160, 46, 'useful work is still 1,000/s', { size: 15 });
  return d.svg();
}
export function sd_idempotency_trace() { return systemFigure("sd_idempotency_trace", "COMMITTED DOES NOT MEAN THE REPLY ARRIVED", "sequence", {"actors": ["scorer", "service", "database"], "steps": [[0, 1, "command key K"], [1, 2, "commit score + key"], [1, 0, "reply lost"], [0, 1, "retry key K"], [1, 0, "return stored result"]]}, "the retry needs the same identity"); }
export function sd_idempotency_state() {
  const d = illustration('sd_idempotency_state', 'THE KEY, THE SCORE CHANGE AND THE STORED RESULT COMMIT TOGETHER', 350);
  d.person(44, 70, 30, { label: 'request 1' });
  d.person(44, 200, 30, { label: 'request 2' });
  d.rect(150, 50, 300, 250, { r: 8, fill: C.accFaint, stroke: C.acc, dash: [6, 4] });
  d.text(300, 70, 'one transaction', { cls: 'ttl', color: C.acc });
  const rows = [['command_keys', 'K │ hash │ result'], ['scores', 'm7 │ home+1'], ['results', 'K → 200, v12']];
  rows.forEach(([t, v], i) => { d.text(170, 104 + i * 64, t, { cls: 'xs', a: 'start' }); chip(d, 170, 112 + i * 64, 260, v, i === 0, 26); });
  d.arrow(82, 88, 162, 124, { stroke: C.acc });
  d.travel([[82, 88], [162, 124]], { dur: 4, at: [0, 0.4], label: 'K', w: 20 });
  d.arrow(82, 218, 162, 134, { stroke: C.ink2, dash: [4, 4] });
  d.travel([[82, 218], [158, 138], [96, 236]], { dur: 4, at: [0.4, 0.9], label: 'K', w: 20, fill: C.card, color: C.ink2 });
  d.text(110, 262, 'unique key\nconflict: read\nstored result', { cls: 'xs', a: 'start', vc: true });
  d.db(510, 120, 90, 110, { label: 'commit' });
  d.arrow(456, 175, 502, 175, { stroke: C.acc });
  d.hand(300, 326, 'a separate key commit leaves a crash gap', { size: 15 });
  return d.svg();
}
export function sd_poll_cost() {
  const d = illustration('sd_poll_cost', '50,000 VIEWERS POLLING EVERY 5 S MAKE 10,000 CHECKS PER SECOND', 330);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) d.phone(28 + c * 22, 52 + r * 40, 30, { stroke: r === 0 && c === 0 ? C.acc : C.gray });
  d.text(136, 266, 'each phone = 1,000 viewers', { cls: 'xs' });
  d.arrow(258, 150, 320, 150, { stroke: C.ink2 });
  d.text(289, 136, '÷ 5 s', { cls: 'mono', size: 11 });
  const stacks = (x, n, s, hot) => { for (let i = 0; i < n; i++) d.envelope(x + (i % 5) * 34, 90 + Math.floor(i / 5) * 40, 28, 20, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); d.text(x + 82, 194, s, { cls: 'sm' }); };
  stacks(340, 10, 'polling: 10,000/s', true);
  stacks(340, 1, '', false);
  d.rect(330, 216, 190, 40, { r: 4, fill: C.card, stroke: C.line });
  d.envelope(342, 226, 28, 20);
  d.text(382, 236, 'API peak: 1,000/s', { cls: 'sm', a: 'start' });
  d.text(530, 110, 'each\nenvelope\n= 1,000/s', { cls: 'xs', a: 'start', vc: true });
  d.hand(330, 300, 'mean wait to see a change: 2.5 s', { size: 15 });
  return d.svg();
}
export function sd_network_end_to_end() {
  const d = illustration('sd_network_end_to_end', 'ONE UNCACHED SCORE READ, HOP BY HOP', 320);
  d.phone(34, 96, 84, { label: 'viewer' });
  d.server(170, 92, 76, 90, { label: 'TLS proxy' }); d.lock(196, 70, 22);
  d.server(330, 92, 76, 90, { label: 'application', led: () => true });
  d.db(500, 96, 90, 86, { label: 'database' });
  [[84, 170], [252, 330], [412, 500]].forEach(([a, b]) => { d.arrow(a, 122, b - 6, 122, { stroke: C.ink2, hl: 6 }); d.arrow(b - 6, 150, a, 150, { stroke: C.gray, hl: 6 }); });
  d.travel([[84, 122], [170, 122], [330, 122], [500, 122], [500, 150], [330, 150], [170, 150], [84, 150]], { dur: 6, label: 'req 41', w: 46 });
  d.clock(368, 222, 34, { spin: 3 }); d.text(368, 254, 'pool wait', { cls: 'xs', color: C.acc });
  d.brace(84, 250, 278, { label: 'viewer hop: client timeout' });
  d.brace(256, 590, 278, { label: 'backend hops: own timeouts and retries' });
  return d.svg();
}
export function sd_network_budget() {
  const d = illustration('sd_network_budget', '2,000 B PER RESPONSE × 1,000 RESPONSES/S = 2,000,000 B/S', 300);
  d.doc(36, 70, 80, 100); d.mono(76, 190, '2,000 B', { size: 11 });
  d.text(146, 120, '×', { size: 26 });
  for (let i = 0; i < 6; i++) d.doc(178 + i * 22, 80 + (i % 2) * 8, 40, 52, { lines: false, stroke: C.gray });
  d.mono(258, 190, '1,000 per second', { size: 11 });
  d.text(370, 120, '=', { size: 26 });
  pipe(d, 400, 610, 120, 46, true);
  d.flowline([[404, 120], [606, 120]], { sw: 2, gap: 10 });
  d.mono(505, 172, '2,000,000 B/s', { size: 12, color: C.acc });
  d.mono(505, 192, '= 16,000,000 bit/s', { size: 10 });
  d.text(320, 258, 'mean in flight at 0.2 s each: 1,000 × 0.2 = 200 requests', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_url_decisions() {
const d=illustration('sd_networking_url_decisions','A URL CARRIES DIFFERENT DECISIONS IN DIFFERENT FIELDS',300);
  const fields=[['https',109,'protected HTTP'],['scores.heron.test',268,'resolve name'],['/matches/m7',176,'lookup resource']];let x=37;
  fields.forEach(([s,w,t],i)=>{d.rect(x,81,w,55,{r:0,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.mono(x+w/2,109,s,{size:12});d.line(x+w/2,143,x+w/2,202,{stroke:C.line,single:true});d.text(x+w/2,224,['scheme','host','path'][i],{cls:'ttl'});d.text(x+w/2,248,t,{cls:'sm'});x+=w;});
  d.text(320,48,'the address is not the score',{cls:'sm'});return d.svg();
}
export function sd_networking_dns_sequence() {
  const d = illustration('sd_networking_dns_sequence', 'A COLD LOOKUP: THE RECURSIVE RESOLVER FOLLOWS ROOT → TLD → ZONE, THEN ANSWERS THE STUB', 340);
  d.laptop(24, 130, 80, { label: 'stub' });
  d.server(200, 116, 80, 90, { label: 'recursive resolver', led: () => true });
  [['root', 50, '"ask .test"'], ['top-level domain', 140, '"ask heron.test"'], ['zone authority', 230, 'A 203.0.113.9']].forEach(([s, y, ans], i) => {
    d.server(500, y, 70, 54, { unit: 14, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 });
    d.text(535, y + 68, s, { cls: 'xs' });
    d.arrow(286, 150, 494, y + 18, { stroke: C.ink2, hl: 6 }); d.arrow(494, y + 36, 286, 170, { stroke: i === 2 ? C.acc : C.gray, hl: 6, dash: i === 2 ? undefined : [4, 3] });
    d.mono(400, y + 16 + (i - 1) * 4, ans, { size: 9, color: i === 2 ? C.acc : undefined });
    d.travel([[286, 150], [494, y + 18], [494, y + 36], [286, 170]], { dur: 9, at: [0.1 + i * 0.25, 0.32 + i * 0.25], r: 3, color: i === 2 ? C.acc : C.ink2 });
  });
  d.arrow(110, 150, 194, 150, { stroke: C.ink2, hl: 6 }); d.arrow(194, 180, 110, 180, { stroke: C.acc, hl: 6 });
  d.text(150, 202, 'cached answer', { cls: 'xs', color: C.acc });
  d.text(320, 322, 'four logical exchanges: stub ↔ resolver and three referrals', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_dns_expiry() {
  const d = illustration('sd_networking_dns_expiry', 'CACHED AT 0 WITH A 60 S TTL: THE AUTHORITY CHANGES AT 20, THE OLD ADDRESS LIVES TO 60', 280);
  const X = 50, W = 540, s = W / 70;
  ruler(d, X, 170, W, 70, 10, ' s');
  d.rect(X, 100, 60 * s, 34, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 10 * s, 117, 'old address', { cls: 'xs' });
  d.rect(X + 20 * s, 100, 40 * s, 34, { r: 2, fill: C.accFaint, stroke: C.acc, dash: [4, 3] }); d.text(X + 40 * s, 117, 'still served after the change', { cls: 'xs', color: C.acc });
  d.pin(X + 20 * s, 96, { label: 'authority changes', dy: -36 });
  d.pin(X + 30 * s, 138, { label: 'read at 30: old', dy: 24, fill: C.paper });
  d.line(X + 61 * s, 90, X + 61 * s, 166, { stroke: C.acc, sw: 2, single: true }); d.text(X + 61 * s, 80, 'refresh at 61', { cls: 'xs', color: C.acc });
  d.text(320, 250, 'the authority cannot erase answers already cached', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_lookup_budget() {
  const d = illustration('sd_networking_lookup_budget', 'FOUR SERIAL 10 MS EXCHANGES = 40 MS BEFORE THE FIRST BYTE OF THE REAL REQUEST', 260);
  const X = 60, W = 520, s = W / 40;
  ['stub ↔ resolver', 'root', 'TLD', 'zone'].forEach((n, i) => { d.rect(X + i * 10 * s, 90, 10 * s, 36, { r: 0, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(X + (i + 0.5) * 10 * s, 108, n, { cls: 'xs' }); });
  ruler(d, X, 138, W, 40, 10, ' ms');
  d.travel([[X, 108], [X + W, 108]], { dur: 4, token: (g) => g.line(0, -22, 0, 22, { stroke: C.acc, sw: 1.4, single: true }) });
  d.text(320, 210, 'each dependency adds its own wait; a cached answer removes them', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_datagram_effect() {
  const d = illustration('sd_networking_datagram_effect', 'B IS LOST: A NEWER SNAPSHOT C REPLACES IT, BUT A MISSING DELTA CORRUPTS THE TOTAL', 320);
  panel(d, 20, 44, 292, 240, 'snapshots');
  d.tape(50, 86, ['A: 1–0', 'B: 2–0', 'C: 2–1'], { cw: 76, h: 30, hot: (i) => i === 2 }); cross(d, 164, 101, 10, C.gray);
  d.text(166, 150, 'show C: it already contains B', { cls: 'sm' }); tick(d, 166, 186, 9, C.ink2);
  panel(d, 328, 44, 292, 240, 'deltas', true);
  d.tape(358, 86, ['A: +1', 'B: +1', 'C: +1'], { cw: 76, h: 30, hot: (i) => i === 1 }); cross(d, 472, 101, 10);
  d.text(474, 150, 'apply A and C: total 2, true total 3', { cls: 'sm', color: C.acc });
  d.text(474, 186, 'needs B recovered, in order', { cls: 'xs' });
  d.text(320, 306, 'the payload contract decides whether a gap matters', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_http_message() {
  const d = illustration('sd_networking_http_message', 'THE REQUEST NAMES A RESOURCE; THE RESPONSE CARRIES ONE REPRESENTATION', 330);
  const env = (x, title, lines, hot) => { d.rect(x, 52, 260, 210, { r: 4, fill: C.paper, stroke: hot ? C.acc : C.ink2 }); d.fillRect(x + 2, 54, 256, 30, hot ? C.accSoft : C.card, 1, 3); d.text(x + 14, 69, title, { cls: 'ttl', a: 'start' }); lines.forEach(([s, sub], i) => { d.mono(x + 14, 104 + i * 30, s, { a: 'start', size: 11, color: sub ? C.gray : undefined }); }); };
  env(34, 'request', [['GET /matches/m7 HTTP/1.1'], ['Host: scores.heron.test'], ['Accept: application/json'], ['Authorization: Bearer …'], ['(no body)', 1]], false);
  env(346, 'response', [['200 OK'], ['Content-Type: json'], ['ETag: "v12"'], ['Cache-Control: max-age=2'], ['{ match, score, clock }']], true);
  d.arrow(298, 110, 342, 110, { stroke: C.ink2 });
  d.arrow(342, 220, 298, 220, { stroke: C.acc });
  d.glow((g) => g.rect(352, 152, 120, 22, { r: 3, stroke: C.acc }));
  d.text(320, 290, 'the validator lets a later read ask "still v12?"', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_http1_wait() {
  const d = illustration('sd_networking_http1_wait', 'ON ONE PIPELINED HTTP/1.1 CONNECTION, B WAITS BEHIND A', 320);
  d.laptop(24, 100, 86, { label: 'client' });
  pipe(d, 118, 420, 110, 22);
  pipe(d, 118, 420, 176, 22, true);
  d.text(270, 86, 'requests: A, then B', { cls: 'sm' });
  d.text(270, 208, 'responses must leave in request order', { cls: 'sm', color: C.acc });
  d.server(440, 80, 160, 150, { unit: 30 });
  chip(d, 470, 98, 110, 'A: score', true); d.lock(586, 96, 18, { stroke: C.acc });
  d.text(525, 134, 'waits on a row lock', { cls: 'xs' });
  chip(d, 470, 160, 110, 'B: thumbnail'); tick(d, 592, 170, 6, C.ink2);
  d.text(525, 196, 'ready, held', { cls: 'xs' });
  d.travel([[420, 176], [128, 176]], { dur: 6, at: [0.55, 0.85], label: 'A', w: 22 });
  d.travel([[420, 176], [128, 176]], { dur: 6, at: [0.7, 1], label: 'B', w: 22, fill: C.card, color: C.ink2 });
  d.hand(320, 270, 'readiness does not reorder the wire', { size: 16 });
  return d.svg();
}
export function sd_networking_http2_frames() {
  const d = illustration('sd_networking_http2_frames', 'HTTP/2 CUTS RESPONSES INTO FRAMES AND INTERLEAVES THEM ON ONE CONNECTION', 340);
  d.text(40, 50, 'score response, 2,000 B ÷ 500 B = 4 frames', { cls: 'sm', a: 'start' });
  d.tape(40, 62, ['A1', 'A2', 'A3', 'A4'], { cw: 56, h: 26, hot: () => true });
  d.text(400, 50, 'thumbnail response', { cls: 'sm', a: 'start' });
  d.tape(400, 62, ['B1', 'B2'], { cw: 56, h: 26 });
  pipe(d, 30, 610, 160, 40);
  d.text(320, 128, 'one TCP connection, frames tagged by stream id', { cls: 'xs' });
  const wire = ['A1', 'B1', 'A2', 'B2', 'A3', 'A4'];
  wire.forEach((s, i) => d.travel([[40, 160], [600, 160]], { dur: 7, at: [i * 0.1, i * 0.1 + 0.55], label: s, w: 28, fill: s[0] === 'A' ? C.accSoft : C.card, color: s[0] === 'A' ? C.acc : C.ink2 }));
  d.text(176, 228, 'client reassembles stream A', { cls: 'sm' });
  d.tape(64, 240, ['A1', 'A2', 'A3', 'A4'], { cw: 56, h: 26, hot: () => true });
  d.text(470, 228, 'and stream B', { cls: 'sm' });
  d.tape(414, 240, ['B1', 'B2'], { cw: 56, h: 26 });
  d.text(320, 304, 'arrival order on the wire is not ownership; the stream id is', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_quic_gap() {
  const d = illustration('sd_networking_quic_gap', 'IN QUIC A LOST PACKET STALLS ONLY ITS OWN STREAM', 330);
  d.rect(24, 50, 592, 170, { r: 10, fill: C.paper, stroke: C.ink2 });
  d.text(36, 66, 'one QUIC connection', { cls: 'xs', a: 'start' });
  pipe(d, 40, 600, 106, 28, true); pipe(d, 40, 600, 172, 28);
  d.text(44, 86, 'stream A', { cls: 'ttl', a: 'start', color: C.acc }); d.text(44, 152, 'stream B', { cls: 'ttl', a: 'start' });
  d.tape(330, 93, ['A1', '', 'A3'], { cw: 50, h: 26, hot: (i) => i === 1 });
  cross(d, 255, 106, 8);
  d.travel([[60, 106], [250, 106]], { dur: 5, at: [0, 0.4], label: 'A2', w: 28 });
  d.text(500, 106, 'A3 waits for A2', { cls: 'sm', a: 'start' });
  d.travel([[60, 172], [560, 172]], { dur: 5, label: 'B2', w: 28, fill: C.card, color: C.ink2 });
  tick(d, 590, 172, 7, C.ink2);
  d.text(320, 244, 'still shared: congestion window', { cls: 'sm' });
  d.rect(170, 256, 300, 16, { r: 2, stroke: C.ink2 }); d.fillRect(172, 258, 190, 12, C.slateSoft);
  d.text(320, 300, 'and the server: one lock can still block both responses', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_tls_checks() {
  const d = illustration('sd_networking_tls_checks', 'THE CLIENT CHECKS THE CHAIN, THE NAME AND THE KEY BEFORE TRUSTING BYTES', 340);
  [['root CA', 'in the trust store'], ['intermediate CA', 'signed by root'], ['leaf', 'scores.heron.test']].forEach(([s, t], i) => {
    const x = 40 + i * 22, y = 60 + i * 50;
    d.doc(x, y, 190, 62, { lines: false, fill: i === 2 ? C.accSoft : C.paper, stroke: i === 2 ? C.acc : C.ink2 });
    d.text(x + 12, y + 20, s, { cls: 'ttl', a: 'start' }); d.text(x + 12, y + 40, t, { cls: 'xs', a: 'start' });
  });
  const steps = ['1 chain to a trusted root', '2 name matches the request', '3 server proves it holds the key'];
  steps.forEach((s, i) => { tick(d, 330, 82 + i * 46, 7, i === 1 ? C.acc : C.ink2); d.text(346, 82 + i * 46, s, { cls: 'sm', a: 'start', color: i === 1 ? C.acc : undefined }); });
  d.laptop(36, 250, 70);
  pipe(d, 114, 520, 272, 26, true);
  d.lock(300, 252, 26, { stroke: C.acc, fill: C.accSoft });
  d.travel([[120, 272], [512, 272]], { dur: 3, token: 'packet' });
  d.server(530, 238, 70, 70);
  d.text(320, 316, '4 protected records; who may read m7 is still the app\'s check', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_rest_boundary() {
  const d = illustration('sd_networking_rest_boundary', 'THE PUBLIC RESOURCE NAME STAYS WHILE THE STORAGE BEHIND IT CHANGES', 330);
  d.laptop(24, 110, 86);
  d.arrow(116, 138, 196, 138, { stroke: C.acc });
  d.mono(156, 122, 'GET', { size: 10 });
  d.line(232, 44, 232, 300, { stroke: C.ink2, sw: 2, single: true });
  d.rect(202, 110, 60, 56, { r: 3, fill: C.accSoft, stroke: C.acc });
  d.mono(232, 186, '/matches/m7', { size: 11, color: C.acc });
  d.text(232, 206, 'resource contract', { cls: 'xs' });
  panel(d, 300, 50, 300, 104, 'before: SQL table');
  d.grid(330, 82, 2, 4, 60, 24, { val: (r, c) => r ? ['m7', '2', '1', '71′'][c] : ['id', 'home', 'away', 'clock'][c], vsize: 9.5 });
  panel(d, 300, 176, 300, 104, 'after: key-value store', true);
  chip(d, 330, 216, 240, 'match:m7 → {home, away, clock}', true);
  d.arrow(266, 128, 296, 104, { stroke: C.gray, hl: 6 }); d.arrow(266, 148, 296, 228, { stroke: C.acc, hl: 6 });
  d.text(450, 304, 'same JSON representation either way', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_grpc_modes() {
  const d = illustration('sd_networking_grpc_modes', 'FOUR gRPC CALL SHAPES, COUNTED IN MESSAGES', 350);
  const rows = [['unary', 1, 1], ['server streaming', 1, 3], ['client streaming', 3, 1], ['bidirectional', 3, 3]];
  rows.forEach(([s, up, down], i) => {
    const y = 58 + i * 72, hot = i === 3;
    d.text(30, y + 24, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined });
    d.laptop(180, y + 6, 46); d.server(540, y, 40, 50, { unit: 14 });
    d.line(234, y + 14, 530, y + 14, { stroke: C.line, single: true }); d.line(530, y + 38, 234, y + 38, { stroke: C.line, single: true });
    for (let k = 0; k < up; k++) d.travel([[240, y + 14], [524, y + 14]], { dur: 4, at: [k * 0.12, k * 0.12 + 0.45], token: (g) => g.envelope(-8, -6, 16, 11, { fill: C.card }) });
    for (let k = 0; k < down; k++) d.travel([[524, y + 38], [240, y + 38]], { dur: 4, at: [0.45 + k * 0.12, 0.9 + k * 0.1], token: (g) => g.envelope(-8, -6, 16, 11, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }) });
    d.mono(600, y + 26, `${up}→ ${down}←`, { size: 9.5, a: 'start' });
  });
  d.text(380, 342, 'many messages ≠ durable effect; the app defines acknowledgement', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_websocket_lifecycle() {
  const d = illustration('sd_networking_websocket_lifecycle', 'A WEBSOCKET OWNER HOLDS LIVE STATE; THE HISTORY MUST OUTLIVE IT', 350);
  d.phone(30, 70, 80, { label: 'viewer' });
  d.server(300, 56, 96, 110, { label: 'gateway', led: () => true });
  chip(d, 412, 70, 120, 'socket 9 → room m7', true);
  const steps = [['Upgrade → 101', 84], ['auth token', 110], ['subscribe m7', 136]];
  steps.forEach(([s, y]) => { d.arrow(76, y, 292, y, { stroke: C.ink2, hl: 6 }); d.text(184, y - 8, s, { cls: 'xs' }); });
  d.arrow(292, 160, 76, 160, { stroke: C.acc, hl: 6 }); d.text(184, 152, 'score v12, v13 …', { cls: 'xs', color: C.acc });
  d.travel([[292, 160], [76, 160]], { dur: 2.5, token: 'packet' });
  bolt(d, 200, 186);
  d.text(232, 206, 'disconnect', { cls: 'sm', a: 'start' });
  d.text(320, 246, 'event log', { cls: 'ttl' });
  d.tape(180, 258, ['v10', 'v11', 'v12', 'v13', 'v14'], { cw: 56, h: 26, hot: (i) => i > 2 });
  d.carrow([[60, 190], [80, 270], [174, 272]], { stroke: C.acc, dash: [4, 4] });
  d.text(110, 298, 'reconnect: resume after v12', { cls: 'xs' });
  d.hand(470, 320, 'the gateway can die; the log cannot', { size: 15 });
  return d.svg();
}
export function sd_networking_sse_replay() {
  const d = illustration('sd_networking_sse_replay', 'LAST-EVENT-ID: 7 LETS THE GATEWAY REPLAY 8 AND 9 FROM HISTORY', 340);
  d.phone(36, 66, 86, { label: 'viewer' });
  d.server(280, 56, 84, 100, { label: 'gateway' });
  d.db(490, 60, 104, 100, { label: 'history' });
  d.tape(452, 196, ['5', '6', '7', '8', '9'], { cw: 34, h: 26, hot: (i) => i > 2 });
  d.arrow(272, 80, 90, 80, { stroke: C.ink2, hl: 6 }); d.text(180, 70, 'event 7', { cls: 'xs' });
  bolt(d, 190, 96, 0.8);
  d.arrow(90, 130, 272, 130, { stroke: C.acc, hl: 6 });
  d.mono(180, 120, 'Last-Event-ID: 7', { size: 9.5, color: C.acc });
  d.arrow(370, 106, 482, 106, { stroke: C.ink2, hl: 6 }); d.text(426, 94, 'after 7?', { cls: 'xs' });
  d.carrow([[540, 226], [420, 260], [96, 176]], { stroke: C.acc, hl: 7 });
  d.travel('M540,226 Q420,260 96,176', { dur: 4, label: '8, 9', w: 34 });
  d.text(320, 300, 'if 8 has expired: send a snapshot and a new boundary', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_proxy_connections() {
  const d = illustration('sd_networking_proxy_connections', 'A REVERSE PROXY TERMINATES ONE CONNECTION AND OPENS ANOTHER', 310);
  d.laptop(24, 98, 84, { label: 'viewer' });
  d.rect(258, 72, 124, 130, { r: 6, fill: C.card, stroke: C.ink2 });
  d.line(320, 76, 320, 198, { stroke: C.line, dash: [4, 4], single: true });
  d.text(289, 92, 'server\nface', { cls: 'xs', vc: true }); d.text(351, 92, 'client\nface', { cls: 'xs', vc: true });
  d.text(320, 220, 'proxy', { cls: 'ttl' });
  d.server(528, 82, 84, 110, { label: 'application' });
  pipe(d, 116, 258, 136, 26, true); pipe(d, 382, 528, 136, 26);
  d.lock(172, 100, 20, { stroke: C.acc }); d.lock(442, 100, 20);
  d.text(186, 176, 'TLS + timeout 1', { cls: 'xs', color: C.acc }); d.text(456, 176, 'TLS + timeout 2', { cls: 'xs' });
  d.travel([[120, 136], [254, 136]], { dur: 4, at: [0, 0.45], r: 3.5 });
  d.travel([[386, 136], [524, 136]], { dur: 4, at: [0.5, 0.95], r: 3.5, color: C.ink2 });
  d.text(320, 268, 'reaching the proxy proves nothing about the application', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_connection_lifetimes() {
  const d = illustration('sd_networking_connection_lifetimes', 'FOUR TIMERS ON ONE CONNECTION ANSWER FOUR DIFFERENT QUESTIONS', 340);
  pipe(d, 40, 560, 70, 22, true);
  d.text(40, 46, 'opened', { cls: 'xs', a: 'start' }); d.text(560, 46, 'rotated', { cls: 'xs', a: 'end' });
  bolt(d, 574, 56, 0.7);
  [60, 110, 150].forEach((x) => d.envelope(x, 63, 18, 13, { fill: C.accSoft, stroke: C.acc }));
  [330, 380, 430].forEach((x) => d.dot(x, 70, 3, C.gray));
  [250, 470].forEach((x) => d.mono(x, 70, '♥', { size: 11 }));
  const rows = [['keep-alive', 'reuse it for the next request', 'saves setup', 105], ['TCP keepalive', 'probe when idle', 'is the peer reachable?', 380], ['heartbeat', 'app ping and pong', 'is the protocol alive?', 250], ['max lifetime', 'close even when healthy', 'refresh ownership', 560]];
  rows.forEach(([s, how, q, x], i) => {
    const y = 128 + i * 50;
    d.line(x, 84, x, y - 10, { stroke: C.line, dash: [3, 4], single: true });
    d.text(40, y, s, { cls: 'ttl', a: 'start', color: i === 0 ? C.acc : undefined });
    d.text(170, y, how, { cls: 'sm', a: 'start' });
    d.text(600, y, q, { cls: 'sm', a: 'end', color: C.gray });
  });
  d.travel([[44, 70], [556, 70]], { dur: 6, r: 3 });
  return d.svg();
}
export function sd_networking_pool_trace() {
  const d = illustration('sd_networking_pool_trace', 'TWO SLOTS, THREE BORROWERS: C WAITS UNTIL A RETURNS X', 320);
  const frames = [['1. A and B borrow', ['A', 'B'], 'C'], ['2. A releases X', ['', 'B'], 'C'], ['3. C borrows X', ['C', 'B'], '']];
  frames.forEach(([s, slots, wait], i) => {
    const x = 26 + i * 204;
    panel(d, x, 48, 186, 210, s, i === 2);
    ['X', 'Y'].forEach((sl, j) => {
      const y = 92 + j * 54, who = slots[j];
      d.rect(x + 18, y, 150, 38, { r: 4, fill: who ? C.card : C.paper, stroke: (i === 2 && j === 0) ? C.acc : C.ink2, dash: who ? undefined : [4, 4] });
      d.mono(x + 34, y + 19, sl, { size: 11 });
      if (who) d.person(x + 110, y + 4, 28, { fill: who === 'C' ? C.accSoft : C.card, stroke: who === 'C' ? C.acc : C.ink2 });
      if (who) d.mono(x + 140, y + 19, who, { size: 11 });
      else d.text(x + 110, y + 19, 'free', { cls: 'xs' });
    });
    if (wait) { d.person(x + 93, 206, 26); d.mono(x + 120, 220, wait, { size: 11 }); d.text(x + 93, 246, 'waiting', { cls: 'xs' }); }
    if (i < 2) d.arrow(x + 188, 150, x + 202, 150, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 292, 'a loan never returned holds its slot after the work ends', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_timeout_scopes() {
  const d = illustration('sd_networking_timeout_scopes', 'EACH WAIT HAS ITS OWN TIMER; ONLY THE DEADLINE BOUNDS THE WHOLE', 330);
  const X = 40, W = 560;
  const segs = [['connect', 0, 70, 'connect timeout'], ['pool', 70, 120, 'acquisition timeout'], ['read', 120, 560, 'read timeout per gap']];
  segs.forEach(([s, a, b, t], i) => {
    d.rect(X + a, 92, b - a, 34, { r: 2, fill: i === 2 ? C.card : C.paper, stroke: C.ink2 });
    d.text(X + (a + b) / 2, 76, s, { cls: 'ttl' });
    d.text(X + (a + b) / 2, 146, t, { cls: 'xs' });
  });
  for (let k = 0; k < 12; k++) d.dot(X + 140 + k * 36, 109, 3.2, C.ink2);
  d.text(X + 340, 172, 'tiny fragments keep every read under its limit', { cls: 'sm' });
  d.rect(X, 200, W, 30, { r: 2, fill: C.accFaint, stroke: C.acc });
  d.line(X + 440, 192, X + 440, 238, { stroke: C.acc, sw: 2, single: true });
  d.text(X + 440, 254, 'deadline', { cls: 'ttl', color: C.acc });
  d.text(X + 220, 215, 'total operation', { cls: 'sm' });
  d.travel([[X, 109], [X + W, 109]], { dur: 7, token: (g) => g.line(0, -24, 0, 128, { stroke: C.acc, sw: 1.2, single: true, rough: 0.2 }) });
  d.hand(320, 300, 'stop at the deadline even if no single timer fired', { size: 15 });
  return d.svg();
}
export function sd_networking_deadline_trace() {
  const d = illustration('sd_networking_deadline_trace', '500 MS − 40 − 60 = 400 MS USEFUL; AFTER 120 MS SPENT, 280 REMAIN', 300);
  const X = 40, W = 560, s = W / 500;
  const segs = [[0, 40, 'network', C.paper], [40, 160, 'admission + auth', C.card], [160, 440, 'database call gets 280', C.accSoft], [440, 500, 'return reserve', C.paper]];
  segs.forEach(([a, b, t, f], i) => { d.rect(X + a * s, 90, (b - a) * s, 44, { r: 0, fill: f, stroke: i === 2 ? C.acc : C.ink2 }); d.text(X + (a + b) / 2 * s, 112, t, { cls: i === 2 ? 'ttl' : 'xs', color: i === 2 ? C.acc : undefined }); });
  ruler(d, X, 148, W, 500, 100, ' ms');
  d.brace(X + 40 * s, X + 440 * s, 82, { dir: -1, label: '400 ms useful budget' });
  d.glow((g) => g.rect(X + 160 * s, 90, 280 * s, 44, { r: 0, stroke: C.acc }));
  d.travel([[X, 112], [X + 160 * s, 112]], { dur: 5, at: [0, 0.6], r: 4 });
  d.text(320, 220, 'the downstream call inherits the remaining time,', { cls: 'sm' });
  d.text(320, 240, 'not a fresh 400 ms', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_retry_classes() {
  const d = illustration('sd_networking_retry_classes', 'THE FAILURE CLASS DECIDES THE NEXT MOVE', 340);
  d.envelope(30, 150, 70, 46, { label: 'failed call' });
  d.carrow([[104, 172], [170, 172], [220, 78]], { stroke: C.ink2 });
  d.arrow(104, 172, 220, 172, { stroke: C.ink2 });
  d.carrow([[104, 172], [170, 172], [220, 266]], { stroke: C.acc });
  const rows = [['invalid input', 'permanent: fix the request, do not retry', 78, false], ['peer unavailable', 'maybe transient: back off, bounded retry', 172, false], ['reply lost', 'uncertain: resend with the same key K', 266, true]];
  rows.forEach(([s, t, y, hot]) => { panel(d, 228, y - 34, 380, 68, '', hot); d.text(246, y - 10, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined }); d.text(246, y + 14, t, { cls: 'sm', a: 'start' }); });
  d.clock(580, 172, 30);
  d.key(560, 266, 26, { stroke: C.acc, fill: C.accSoft });
  cross(d, 588, 78, 8, C.ink2);
  return d.svg();
}
export function sd_networking_backoff_steps() {
  const d = illustration('sd_networking_backoff_steps', 'FULL JITTER: EACH WAIT IS RANDOM IN [0, CEILING]; THE CEILING DOUBLES TO A CAP', 330);
  const ceil = [100, 200, 400, 800, 800], X = 120, s = 0.56;
  ceil.forEach((c, i) => {
    const y = 60 + i * 46;
    d.mono(40, y + 12, `attempt ${i}`, { a: 'start', size: 10 });
    d.rect(X, y, c * s, 24, { r: 2, fill: i >= 3 ? C.accSoft : C.card, stroke: i >= 3 ? C.acc : C.ink2 });
    d.dot(X + c * s / 2, y + 12, 3, C.ink);
    d.mono(X + c * s + 10, y + 12, `ceiling ${c} · mean ${c / 2}`, { a: 'start', size: 9.5 });
    d.travel([[X + 4, y + 12], [X + c * s - 4, y + 12], [X + 4, y + 12]], { dur: 2 + i * 0.37, r: 3 });
  });
  ruler(d, X, 296, 800 * s, 800, 200, ' ms');
  d.text(X + 800 * s, 46, 'cap', { cls: 'sm', color: C.acc });
  d.line(X + 800 * s, 52, X + 800 * s, 286, { stroke: C.acc, dash: [4, 4], single: true });
  return d.svg();
}
export function sd_networking_set_add() {
  const d = illustration('sd_networking_set_add', 'APPLY THE SAME MESSAGE TWICE: "SET 10" STAYS 10, "ADD 10" BECOMES 20', 300);
  const board = (x, title, vals, hot) => {
    d.text(x + 130, 52, title, { cls: 'ttl', color: hot ? C.acc : undefined });
    vals.forEach((v, i) => {
      const bx = x + i * 92;
      d.rect(bx, 74, 74, 62, { r: 4, fill: C.ink, stroke: C.ink });
      d.mono(bx + 37, 105, v, { size: 22, color: i === 2 && hot ? C.acc : C.paper });
      d.text(bx + 37, 152, ['start', 'once', 'twice'][i], { cls: 'xs' });
      if (i < 2) d.arrow(bx + 76, 105, bx + 90, 105, { stroke: C.gray, hl: 5 });
    });
  };
  board(28, 'set total to 10', ['0', '10', '10'], false);
  board(336, 'add 10', ['0', '10', '20'], true);
  d.envelope(260, 184, 120, 50);
  d.mono(320, 250, 'key K, add 10', { size: 10 });
  d.text(320, 276, 'with key K the second "add" is recognised as a retry', { cls: 'sm' });
  return d.svg();
}
export function sd_networking_commit_gap() {
  const d = illustration('sd_networking_commit_gap', 'TWO SEPARATE COMMITS LEAVE A CRASH GAP IN EITHER ORDER', 350);
  const lane = (y, a, b, bad) => {
    d.arrow(30, y, 608, y, { stroke: C.gray });
    chip(d, 60, y - 30, 150, a, false, 26);
    bolt(d, 300, y - 30);
    chip(d, 400, y - 30, 150, b, false, 26);
    d.rect(400, y - 30, 150, 26, { r: 4, stroke: C.gray, dash: [3, 3] });
    cross(d, 475, y - 17, 18, C.gray);
    d.text(320, y + 20, bad, { cls: 'sm', color: C.acc });
  };
  lane(84, 'commit score', 'commit key K', 'effect without a key: the retry applies it again');
  lane(178, 'commit "success" K', 'commit score', 'success without an effect: the retry is told it worked');
  d.rect(110, 238, 420, 58, { r: 8, fill: C.accFaint, stroke: C.acc });
  chip(d, 130, 254, 180, 'score change', true, 26); chip(d, 330, 254, 180, 'key K + result', true, 26);
  d.text(320, 316, 'one transaction: both or neither', { cls: 'ttl', color: C.acc });
  return d.svg();
}
export function sd_networking_key_retention() {
  const d = illustration('sd_networking_key_retention', 'RETRIES ARE SUPPORTED FOR 24 H; KEY EVIDENCE IS KEPT FOR 48 H', 310);
  const X = 60, W = 520, s = W / 48;
  d.rect(X, 74, 24 * s, 34, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(X + 12 * s, 91, 'client retry window', { cls: 'sm' });
  d.rect(X, 130, 48 * s, 34, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 24 * s, 147, 'stored key evidence', { cls: 'sm' });
  ruler(d, X, 186, W, 48, 12, ' h');
  [[12, 'hour 12: recover the stored result', true], [36, 'hour 36: outside the contract', false]].forEach(([h, s2, hot]) => {
    const x = X + h * s;
    d.pin(x, 70, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.line(x, 70, x, 176, { stroke: hot ? C.acc : C.gray, dash: [3, 3], single: true });
    d.text(x, 240, s2, { cls: 'sm', color: hot ? C.acc : undefined });
  });
  d.text(320, 280, 'the extra 24 h is a margin, not a promise', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_delivery_resources() {
  const d = illustration('sd_networking_delivery_resources', '50,000 VIEWERS, THREE WAYS TO LEARN ABOUT A NEW SCORE', 340);
  const cols = [['poll every 5 s', '10,000 requests/s', 'repeated requests'], ['long poll', '50,000 held requests', 'parked waits'], ['push', '50,000 open streams', 'subscriptions + buffers']];
  cols.forEach(([s, n, unit], i) => {
    const x = 22 + i * 204, hot = i === 2;
    panel(d, x, 44, 190, 254, s, hot);
    d.phone(x + 20, 82, 60); d.server(x + 126, 82, 46, 64, { unit: 14 });
    if (i === 0) { [0, 1, 2].forEach((k) => d.travel([[x + 56, 100], [x + 120, 100], [x + 56, 120]], { dur: 3, at: [k / 3, k / 3 + 0.3], r: 3, color: C.ink2 })); }
    if (i === 1) { d.arrow(x + 56, 104, x + 120, 104, { stroke: C.ink2, hl: 5 }); d.clock(x + 88, 136, 26, { spin: 6 }); }
    if (i === 2) { pipe(d, x + 54, x + 124, 112, 12, true); d.travel([[x + 122, 112], [x + 56, 112]], { dur: 2, r: 3 }); }
    d.mono(x + 95, 206, n, { size: 10.5, color: hot ? C.acc : undefined });
    d.text(x + 95, 230, unit, { cls: 'xs' });
  });
  d.text(320, 322, 'different units: requests per second, held requests, open connections', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_read_time() {
  const d = illustration('sd_networking_read_time', 'SERIAL STAGES ADD UP: 60, THEN 100, THEN 200 MS', 340);
  const st = [['network', 40], ['proxy', 20], ['identity', 30], ['pool', 10], ['query', 60], ['return', 40]];
  const X = 150, s = 2.2; let t = 0;
  st.forEach(([name, v], i) => {
    const y = 52 + i * 38;
    d.text(X - 14, y + 12, name, { cls: 'sm', a: 'end' });
    d.rect(X + t * s, y, v * s, 24, { r: 2, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 });
    d.mono(X + (t + v) * s + 8, y + 12, `${v} ms`, { a: 'start', size: 9.5 });
    t += v;
  });
  [[60, 1], [100, 3], [200, 5]].forEach(([c, i]) => { d.line(X + c * s, 46, X + c * s, 284, { stroke: C.acc, dash: [3, 4], single: true }); d.mono(X + c * s, 298, `${c} ms`, { size: 10, color: C.acc }); });
  d.travel([[X, 290], [X + 200 * s, 290]], { dur: 6, r: 3.5 });
  d.text(320, 326, 'if stages overlap, sum only the critical path', { cls: 'xs' });
  return d.svg();
}
export function sd_networking_live_counts() {
  const d = illustration('sd_networking_live_counts', 'ONE THIN STREAM IN, A FLOOD OUT: 4,000 B/S BECOMES 200,000,000 B/S', 340);
  d.person(44, 120, 34, { label: 'scorer' });
  pipe(d, 72, 220, 150, 8);
  d.mono(146, 132, '20 × 200 B = 4,000 B/s', { size: 9.5 });
  d.server(222, 104, 80, 96, { label: 'fan-out', led: () => true });
  d.travel([[76, 150], [218, 150]], { dur: 1.5, r: 2.5 });
  for (let i = 0; i < 9; i++) { const y = 48 + i * 30; d.line(306, 152, 420, y + 10, { stroke: C.acc, single: true, sw: 1.2 }); d.travel([[306, 152], [420, y + 10]], { dur: 1.2, at: [i / 12, i / 12 + 0.5], r: 2.5 }); }
  for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) d.phone(426 + c * 30, 40 + r * 30, 22, { stroke: C.gray });
  d.text(512, 322, '50,000 viewers', { cls: 'sm' });
  d.mono(170, 248, '20 × 50,000 = 1,000,000 deliveries/s', { size: 10 });
  d.mono(170, 270, '1,000,000 × 200 B = 200,000,000 B/s', { size: 10, color: C.acc });
  return d.svg();
}
export function sd_networking_component_jobs() {
  const d = illustration('sd_networking_component_jobs', 'EACH BOUNDARY HAS A HAPPY-PATH JOB AND A RECOVERY JOB', 340);
  const st = [['naming', 'find the endpoint', 'refresh a stale answer'], ['transport + TLS', 'ordered, protected bytes', 'reconnect safely'], ['application', 'permission + contract', 'recover command key K'], ['state', 'read or commit', 'serve a suitable history']];
  st.forEach(([s, a, b], i) => {
    const x = 26 + i * 152, hot = i === 2;
    if (i === 0) d.doc(x + 38, 52, 54, 66);
    if (i === 1) { pipe(d, x + 20, x + 112, 86, 20); d.lock(x + 56, 58, 20); }
    if (i === 2) d.server(x + 38, 48, 60, 72, { fill: C.accSoft, stroke: C.acc });
    if (i === 3) d.db(x + 38, 52, 60, 66);
    if (i < 3) d.arrow(x + 120, 86, x + 146, 86, { stroke: C.gray, hl: 6 });
    d.text(x + 66, 142, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.rect(x, 162, 136, 52, { r: 4, fill: C.card, stroke: C.line }); d.text(x + 68, 188, a, { cls: 'xs' });
    d.rect(x, 226, 136, 52, { r: 4, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.line, dash: [4, 3] }); d.text(x + 68, 252, b, { cls: 'xs' });
  });
  d.text(14, 188, 'do', { cls: 'xs', a: 'start' }); d.text(14, 252, 'fix', { cls: 'xs', a: 'start' });
  d.travel([[92, 86], [548, 86]], { dur: 5, r: 3.5 });
  d.text(320, 312, 'one deployment can hold several jobs; their failure boundaries remain', { cls: 'xs' });
  return d.svg();
}

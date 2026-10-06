import { C, fig, beMap, beCover, card, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble, shield, browser } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Realtime options', 'The WebSocket protocol', 'Realtime application concerns', 'Scaling realtime', 'File uploads', 'Object storage', 'Searching the database', 'Full-text search', 'Search engines', 'Vector and hybrid search', 'Track, upload and search end to end'];
export const where_be_rt = (stage = 99) => beMap('where_be_rt', PARTS, stage);

function bucketObj(d, x, y, w, h, o = {}) {
  d.path(`M${x},${y} L${x + 10},${y + h} L${x + w - 10},${y + h} L${x + w},${y}`, { stroke: o.stroke ?? C.ink2, sw: 1.4, fill: o.fill ?? C.card });
  d.ellipse(x + w / 2, y, w, 18, { fill: C.paper, stroke: o.stroke ?? C.ink2 });
  if (o.label) d.text(x + w / 2, y + h + 14, o.label, { cls: 'xs' });
}

function magnifier(d, x, y, r, o = {}) {
  d.circle(x, y, r * 2, { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2, sw: 1.6 });
  d.line(x + r * 0.7, y + r * 0.7, x + r * 1.6, y + r * 1.6, { stroke: o.stroke ?? C.ink2, sw: 4, single: true });
}

export const cover_be_rt = () => beCover('cover_be_rt', 'XII', ['Realtime, uploads', 'and search'], 'WebSockets, object storage, inverted indexes and vectors', (d, y) => {
  d.phone(60, y + 20, 160); d.path(`M76,${y + 80} Q100,${y + 60} 120,${y + 100} T140,${y + 140}`, { stroke: C.acc, sw: 2 }); d.dot(140, y + 140, 5, C.acc);
  pipe(d, 160, 300, y + 100, 20, true); for (let i = 0; i < 2; i++) d.travel([[160, y + 100], [300, y + 100]], { token: 'packet', at: [i * 0.5, i * 0.5 + 0.4] });
  bucketObj(d, 310, y + 160, 120, 100, { label: 'object storage' }); d.arrow(130, y + 190, 300, y + 200, { stroke: C.ink2 });
  magnifier(d, 520, y + 90, 50, { stroke: C.acc }); d.mono(520, y + 90, 'biryani', { size: 11, color: C.acc });
  d.hand(480, y + 220, 'push, store, find', { size: 18 });
}, [['Realtime', 'polling, SSE, WebSockets'], ['Scale', 'fan-out, presence, millions'], ['Uploads', 'presigned URLs, validation'], ['Search', 'BM25, engines, vectors']]);

export function be_rt_polling() {
  const d = fig('be_rt_polling', 'POLLING: "IS MY FOOD READY?" EVERY 5 S, AND THE ANSWER IS NEARLY ALWAYS "NO"', 300);
  d.phone(30, 80, 100);
  for (let i = 0; i < 12; i++) { const x = 120 + i * 40, hot = i === 7; d.arrow(x, 110, x + 14, 160, { stroke: hot ? C.acc : C.line, hl: 4 }); d.mono(x + 10, 180, hot ? '200' : '304', { size: 8.5, color: hot ? C.acc : C.gray }); }
  d.server(560, 90, 60, 80, { unit: 12 });
  d.text(320, 220, '50,000 active orders ÷ 5 s = 10,000 requests/s; 480 polls per 40-minute order, 5 with news', { cls: 'sm' });
  d.text(320, 248, 'about 1% of polls carry an update; the rest are 304s that still cost a request each', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_rt_longpoll() {
  const d = fig('be_rt_longpoll', 'LONG POLLING: ASK ONCE, AND THE SERVER ANSWERS ONLY WHEN THERE IS NEWS OR 30 S PASS', 300);
  const y = lanes(d, ['phone', 'server'], { y: 90, gap: 90, x0: 110, x1: 610, tl: 's' });
  const X = (s) => 120 + s * 6;
  d.arrow(X(0), y(0) + 4, X(1), y(1) - 6, { stroke: C.ink2, hl: 5 }); seg(d, X(1), y(1), X(30) - X(1), 'held open, waiting', { fill: C.paper, dash: [4, 3] }); d.arrow(X(30), y(1) - 6, X(31), y(0) + 4, { stroke: C.gray, hl: 5 }); d.text(X(30), y(0) - 16, 'timeout: empty reply', { cls: 'xs' });
  d.arrow(X(31), y(0) + 4, X(32), y(1) - 6, { stroke: C.ink2, hl: 5 }); seg(d, X(32), y(1), X(44) - X(32), 'held', { fill: C.paper, dash: [4, 3] }); d.arrow(X(44), y(1) - 6, X(45), y(0) + 4, { stroke: C.acc, hl: 5 }); d.text(X(44), y(0) - 16, 'status: cooking', { cls: 'xs', color: C.acc });
  d.text(320, 260, 'near-instant delivery over plain HTTP; one held request per waiting client, and a gap at each reconnect', { cls: 'xs' });
  return d.svg();
}

export function be_rt_sse() {
  const d = fig('be_rt_sse', 'SERVER-SENT EVENTS: ONE LONG RESPONSE, EVENTS DRIP DOWN IT', 320);
  d.phone(30, 90, 100); d.server(550, 90, 60, 90, { unit: 12 });
  pipe(d, 90, 540, 140, 26);
  ['id: 41', 'id: 42', 'id: 43'].forEach((s, i) => d.travel([[530, 140], [100, 140]], { label: s, w: 50, at: [i * 0.3, i * 0.3 + 0.4] }));
  card(d, 140, 190, 360, ['Content-Type: text/event-stream', '', 'id: 42', 'event: status', 'data: {"order":124,"status":"cooking"}'], { size: 9.5, hot: [2] });
  d.text(320, 306, 'on reconnect the browser sends Last-Event-ID: 42 and the server resumes from 43', { cls: 'xs' });
  return d.svg();
}

export function be_rt_ws() {
  const d = fig('be_rt_ws', 'A WEBSOCKET: ONE CONNECTION, MESSAGES BOTH WAYS AT ANY TIME', 280);
  d.phone(30, 90, 100); d.server(550, 90, 60, 90, { unit: 12 });
  pipe(d, 90, 540, 120, 22, true); pipe(d, 90, 540, 160, 22);
  for (let i = 0; i < 3; i++) d.travel([[100, 120], [530, 120]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.3] });
  for (let i = 0; i < 3; i++) d.travel([[530, 160], [100, 160]], { token: 'packet', at: [i * 0.33 + 0.15, i * 0.33 + 0.45], fill: C.card, color: C.ink2 });
  d.text(320, 100, 'client → server: chat, typing, location', { cls: 'xs', color: C.acc }); d.text(320, 186, 'server → client: status, messages, presence', { cls: 'xs' });
  d.text(320, 240, 'full duplex over one TCP connection, after an HTTP upgrade', { cls: 'sm' });
  return d.svg();
}

export function be_rt_compare() {
  const d = fig('be_rt_compare', 'FIVE WAYS TO GET NEWS TO A CLIENT', 340);
  sheet(d, 20, 50, [['', 110], ['polling', 90], ['long poll', 90], ['SSE', 100], ['WebSocket', 100], ['WebTransport', 110]], [['direction', 'pull', 'pull', 'server → client', 'both', 'both'], ['transport', 'HTTP', 'HTTP', 'HTTP stream', 'TCP after upgrade', 'HTTP/3, QUIC'], ['reconnection', 'n/a', 'each reply', 'built in', 'your code', 'your code'], ['proxies', 'easy', 'easy', 'easy, no buffering', 'need upgrade', 'need HTTP/3'], ['best for', 'rare changes', 'fallback', 'feeds, status', 'chat, games', 'low-latency media']], { rh: 40, size: 9, hot: [4] });
  return d.svg();
}

export function be_ws_handshake() {
  const d = fig('be_ws_handshake', 'THE UPGRADE HANDSHAKE: AN HTTP REQUEST THAT TURNS INTO A WEBSOCKET', 320);
  card(d, 20, 50, 290, ['GET /ws HTTP/1.1', 'Host: rt.wren.example', 'Connection: Upgrade', 'Upgrade: websocket', 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version: 13', 'Origin: https://app.wren.example'], { size: 9, hot: [2, 3] });
  card(d, 330, 50, 290, ['HTTP/1.1 101 Switching Protocols', 'Connection: Upgrade', 'Upgrade: websocket', 'Sec-WebSocket-Accept:', '  s3pPLMBiTxaQ9kYGzzhZRbK+xOo='], { size: 9, hot: [0, 4] });
  d.text(320, 220, 'Accept = base64(SHA-1(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))', { cls: 'mono', size: 9.5 });
  d.text(320, 250, 'proves the server understood WebSockets; it is not authentication', { cls: 'xs' });
  d.text(320, 282, 'after the 101, the same TCP connection carries WebSocket frames instead of HTTP', { cls: 'xs' });
  return d.svg();
}

export function be_ws_frame() {
  const d = fig('be_ws_frame', 'A WEBSOCKET FRAME: 2 TO 14 BYTES OF HEADER, THEN THE PAYLOAD', 280);
  const f = [['FIN', 1], ['RSV', 3], ['opcode', 4], ['MASK', 1], ['length', 7], ['ext. length 0/16/64', 16], ['masking key (client only) 32', 32], ['payload…', 24]];
  let x = 20; const sc = 6.2;
  f.forEach(([s, bits], i) => { const w = Math.min(bits, 32) * sc * (i > 4 ? 0.6 : 1) + (bits < 4 ? 14 : 0); d.box(x, 80, w, 40, s, { r: 2, cls: 'mono', size: 8.5, fill: [2, 3].includes(i) ? C.accSoft : C.card, stroke: [2, 3].includes(i) ? C.acc : C.ink2 }); x += w; });
  d.text(320, 150, 'opcodes: 0x1 text, 0x2 binary, 0x8 close, 0x9 ping, 0xA pong', { cls: 'mono', size: 9.5 });
  d.text(320, 180, 'clients must mask every frame they send, so caches and proxies cannot be poisoned by crafted bytes', { cls: 'xs' });
  d.text(320, 206, 'a 100-byte message costs 2 bytes of header from the server, 6 from the client', { cls: 'xs' });
  return d.svg();
}

export function be_ws_lifecycle() {
  const d = fig('be_ws_lifecycle', 'A CONNECTION\'S LIFE: OPEN, PING, DROP, RECONNECT WITH BACKOFF, RESUME', 300);
  const st = [['connecting', 50], ['open', 170], ['pings every 30 s', 300], ['dropped (1006)', 430], ['reconnect 1 s, 2 s, 4 s + jitter', 560]];
  st.forEach(([s, x], i) => { d.circle(x, 120, 54, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(x, 182, s, { cls: 'xs' }); if (i < 4) d.arrow(x + 30, 120, st[i + 1][1] - 30, 120, { stroke: C.gray, hl: 5 }); });
  d.carrow([[560, 90], [360, 40], [170, 90]], { stroke: C.acc, dash: [4, 3] }); d.text(360, 52, 'resume: "last seq 912"', { cls: 'mono', size: 9, color: C.acc });
  d.text(320, 236, 'close codes: 1000 normal, 1001 going away, 1006 abnormal (no close frame), 1011 server error', { cls: 'xs' });
  d.text(320, 262, 'a server deploy sends 1001 and clients reconnect elsewhere; missed messages come from the sequence', { cls: 'xs' });
  return d.svg();
}

export function be_ws_auth() {
  const d = fig('be_ws_auth', 'AUTHENTICATING A WEBSOCKET WITH A SHORT-LIVED TICKET', 300);
  const y = lanes(d, ['app', 'API', 'WS server'], { y: 70, gap: 70, x0: 110, x1: 610, time: false });
  d.arrow(140, y(0) + 4, 140, y(1) - 8, { stroke: C.ink2, hl: 5 }); d.text(150, (y(0) + y(1)) / 2, 'POST /ws-ticket (Bearer token)', { cls: 'mono', size: 8.5, a: 'start' });
  d.arrow(240, y(1) - 8, 240, y(0) + 4, { stroke: C.ink2, hl: 5, dash: [3, 3] }); d.text(250, y(0) + 20, 'ticket t_9fk2, 30 s, single use', { cls: 'mono', size: 8.5, a: 'start' });
  d.arrow(400, y(0) + 4, 400, y(2) - 8, { stroke: C.acc, hl: 5 }); d.text(410, (y(0) + y(2)) / 2 + 30, 'wss://…/ws?ticket=t_9fk2', { cls: 'mono', size: 8.5, a: 'start', color: C.acc });
  d.text(320, 270, 'the WS server redeems the ticket once, checks Origin, and binds user 42 to the connection', { cls: 'xs' });
  return d.svg();
}

export function be_ws_cswsh() {
  const d = fig('be_ws_cswsh', 'CROSS-SITE WEBSOCKET HIJACKING: COOKIES TRAVEL, SO CHECK THE ORIGIN', 300);
  browser(d, 30, 60, 250, 150, 'https://evil.example'); d.mono(155, 130, 'new WebSocket(', { size: 9 }); d.mono(155, 146, '"wss://rt.wren.example")', { size: 9, color: C.acc });
  d.arrow(284, 135, 420, 135, { stroke: C.acc }); d.text(352, 120, 'cookie: sess=…', { cls: 'mono', size: 8.5 });
  shield(d, 470, 90, 70, { label: 'Origin?', fill: C.accSoft, stroke: C.acc }); cross(d, 560, 135, 10);
  d.text(320, 250, 'browsers send cookies on the upgrade and do not apply CORS to WebSockets; reject unknown Origins', { cls: 'xs' });
  return d.svg();
}

export function be_ws_backpressure() {
  const d = fig('be_ws_backpressure', 'A SLOW CONSUMER: ONE CONNECTION\'S SEND BUFFER FILLS WHILE OTHERS ARE FINE', 300);
  d.server(30, 100, 70, 90, { label: 'WS server' });
  [['fast phone', 70, 0.1], ['fast laptop', 140, 0.15], ['phone in a tunnel', 210, 0.95]].forEach(([s, y, lv], i) => { d.rect(150, y - 16, 160, 32, { r: 4, fill: C.paper }); d.fillRect(152, y - 14, 156 * lv, 28, i === 2 ? C.accSoft : C.card); d.text(330, y, s, { cls: 'sm', a: 'start', color: i === 2 ? C.acc : undefined }); });
  d.text(480, 110, 'policy when the buffer\npasses 1 MB:', { cls: 'xs', vc: true }); ['coalesce: keep the latest status', 'drop low-priority messages', 'close with 1008 / 1013, resume later'].forEach((s, i) => d.text(480, 150 + i * 20, s, { cls: 'xs' }));
  d.text(320, 274, 'without a limit, one slow client grows the server\'s memory without bound', { cls: 'xs' });
  return d.svg();
}

export function be_ws_state() {
  const d = fig('be_ws_state', 'EVERY OPEN CONNECTION IS STATE THAT LIVES ON ONE SERVER', 300);
  [0, 1, 2].forEach((i) => { const x = 60 + i * 200; d.server(x, 70, 90, 110, { label: `ws-${i + 1}` }); for (let k = 0; k < 14; k++) d.dot(x + 110 + (k % 4) * 10, 80 + Math.floor(k / 4) * 22, 3, k % 6 === 0 ? C.acc : C.gray); });
  d.text(320, 220, '1,000,000 connections × 20 KB (illustrative) = 20 GB of buffers and session state', { cls: 'mono', size: 10 });
  d.text(320, 248, 'plus a file descriptor each, and an LB that keeps each client on its server for the connection\'s life', { cls: 'xs' });
  return d.svg();
}

export function be_ws_fanout() {
  const d = fig('be_ws_fanout', 'FAN-OUT ACROSS SERVERS: PUBLISH ONCE, EVERY WS SERVER DELIVERS TO ITS OWN CLIENTS', 320);
  d.server(30, 120, 70, 80, { label: 'orders svc' });
  d.db(220, 120, 110, 80, { label: 'Redis\npub/sub', stroke: C.acc, fill: C.accFaint });
  d.arrow(104, 160, 214, 160, { stroke: C.acc }); d.text(160, 146, 'PUBLISH order:124', { cls: 'mono', size: 8.5 });
  [0, 1, 2].forEach((i) => { d.server(420, 50 + i * 90, 60, 66, { unit: 12, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.arrow(334, 160, 414, 83 + i * 90, { stroke: i === 1 ? C.acc : C.line, hl: 5 }); });
  d.phone(540, 136, 50); d.arrow(484, 163, 536, 160, { stroke: C.acc }); d.text(565, 200, 'user 42', { cls: 'xs' });
  d.text(320, 300, 'each server subscribes to the channels its clients care about, so only ws-2 forwards order:124', { cls: 'xs' });
  return d.svg();
}

export function be_ws_rooms() {
  const d = fig('be_ws_rooms', 'ROOMS: A CHANNEL NAME MAPS TO CONNECTIONS ON MANY SERVERS', 300);
  [['restaurant:9 (kitchen board)', 70, [0, 1]], ['order:124 (one customer)', 140, [1]], ['promo:friday (200,000)', 210, [0, 1, 2]]].forEach(([s, y, srv], i) => { d.box(30, y - 16, 200, 32, s, { r: 6, cls: 'mono', size: 9, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); srv.forEach((k) => d.line(232, y, 400, 70 + k * 70, { stroke: i === 2 ? C.acc : C.line, single: true })); });
  [0, 1, 2].forEach((k) => d.server(400, 44 + k * 70, 50, 52, { unit: 12, label: `ws-${k + 1}` }));
  d.text(560, 140, 'a broadcast to 200,000\nis 3 publishes to servers,\nthen 200,000 local writes', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ws_presence() {
  const d = fig('be_ws_presence', 'PRESENCE: COURIERS HEARTBEAT EVERY 10 S; SILENT ONES FADE AFTER 30 S', 320);
  d.rect(30, 50, 330, 230, { r: 8, fill: C.paper });
  for (let i = 0; i < 22; i++) { const x = 50 + (i * 53) % 300, y = 70 + (i * 37) % 190; d.blink((g) => g.dot(x, y, 5, i % 7 === 0 ? C.gray : C.acc), { dur: 2 + (i % 5) * 0.4, low: i % 7 === 0 ? 0.05 : 0.5 }); }
  card(d, 380, 70, 240, ['ZADD online:zone7 now courier:31', 'ZRANGEBYSCORE online:zone7', '  (now − 30000) +inf', 'ZREMRANGEBYSCORE … 0 (now − 30000)'], { size: 8.5 });
  d.text(500, 210, '5,000 couriers ÷ 10 s =\n500 heartbeats per second', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ws_storm() {
  const d = fig('be_ws_storm', 'A SERVER RESTARTS: 50,000 CLIENTS RECONNECT AT ONCE, OR SPREAD OVER 30 S', 300);
  const M = d.axes(70, 50, 480, 180, { xmin: 0, xmax: 40, ymin: 0, ymax: 52000, xl: 'seconds', yl: 'handshakes/s' });
  d.rect(M.X(0.5), M.Y(50000), M.X(1.5) - M.X(0.5), M.Y(0) - M.Y(50000), { r: 0, fill: C.accSoft, stroke: C.acc }); d.text(M.X(2), M.Y(48000), '50,000 in 1 s', { cls: 'xs', a: 'start', color: C.acc });
  d.fn(() => 1667, 0.5, 30.5, M, { stroke: C.slate }); d.text(M.X(16), M.Y(5500), 'random delay 0 to 30 s: about 1,667/s', { cls: 'xs' });
  d.text(320, 280, 'jittered reconnects, staggered server drains and a token check that does not hit the database each time', { cls: 'xs' });
  return d.svg();
}

export function be_up_multipart() {
  const d = fig('be_up_multipart', 'A MULTIPART/FORM-DATA BODY: PARTS SEPARATED BY A BOUNDARY STRING', 320);
  card(d, 40, 50, 560, ['Content-Type: multipart/form-data; boundary=----wren7MA4YWxk', '', '------wren7MA4YWxk', 'Content-Disposition: form-data; name="caption"', '', 'Biryani from Spice Hut', '------wren7MA4YWxk', 'Content-Disposition: form-data; name="photo"; filename="IMG_2041.jpg"', 'Content-Type: image/jpeg', '', '<5,000,000 bytes of JPEG>', '------wren7MA4YWxk--'], { size: 9, hot: [7, 8] });
  d.text(320, 290, 'filename and Content-Type come from the client and prove nothing about the bytes', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_up_stream() {
  const d = fig('be_up_stream', 'BUFFER THE WHOLE FILE IN MEMORY, OR STREAM IT THROUGH IN CHUNKS', 300);
  panel(d, 20, 40, 290, 230, 'buffered', true); panel(d, 330, 40, 290, 230, 'streamed');
  d.ram(50, 120, 230, 50, { chips: 6, chip: () => C.accSoft }); d.text(165, 200, '50 uploads × 100 MB = 5 GB in RAM', { cls: 'xs', color: C.acc });
  pipe(d, 360, 590, 140, 22); for (let i = 0; i < 4; i++) d.travel([[360, 140], [590, 140]], { token: 'packet', at: [i * 0.25, i * 0.25 + 0.3] });
  d.text(475, 200, '64 KB chunks: memory stays flat,\nlimits enforced as bytes arrive', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_up_magic() {
  const d = fig('be_up_magic', 'MAGIC BYTES: WHAT THE FILE ACTUALLY STARTS WITH', 300);
  [['PNG', '89 50 4E 47 0D 0A 1A 0A', false], ['JPEG', 'FF D8 FF E0 …', false], ['PDF', '25 50 44 46 2D  (%PDF-)', false], ['"photo.jpg"', '3C 3F 70 68 70  (<?php)', true]].forEach(([t, b, bad], i) => { const y = 70 + i * 46; d.text(140, y, t, { cls: 'ttl', a: 'end', color: bad ? C.acc : undefined }); d.box(160, y - 15, 300, 30, b, { r: 4, cls: 'mono', size: 10, fill: bad ? C.accSoft : C.card, stroke: bad ? C.acc : C.ink2 }); if (bad) cross(d, 490, y, 9); else tick(d, 490, y, 8); });
  d.text(320, 270, 'check signatures, then decode and re-encode images so anything hidden inside is discarded', { cls: 'xs' });
  return d.svg();
}

export function be_up_pipeline() {
  const d = fig('be_up_pipeline', 'AN UPLOAD IS UNTRUSTED UNTIL A PIPELINE SAYS OTHERWISE', 300);
  steps(d, [['size limit', '413 above 10 MB'], ['magic bytes', 'allowlist types'], ['re-encode', 'strip metadata'], ['malware scan', 'ClamAV or service'], ['publish', 'move to clean']], 90, 3, { x0: 20, w: 108, gap: 12, h: 60 });
  bucketObj(d, 60, 190, 90, 60, { label: 'quarantine/' }); bucketObj(d, 490, 190, 90, 60, { label: 'photos/', stroke: C.acc });
  d.arrow(160, 220, 480, 220, { stroke: C.gray, dash: [4, 3] });
  d.text(320, 286, 'nothing is served from quarantine; a failed check deletes the object and tells the user why', { cls: 'xs' });
  return d.svg();
}

export function be_up_traversal() {
  const d = fig('be_up_traversal', 'PATH TRAVERSAL: A FILENAME THAT CLIMBS OUT OF THE UPLOAD DIRECTORY', 320);
  const tree = [['/', 300, 60], ['etc', 180, 120], ['srv', 420, 120], ['passwd', 180, 180], ['wren', 420, 180], ['uploads', 420, 240]];
  tree.forEach(([s, x, y], i) => { d.box(x - 40, y - 14, 80, 28, s, { r: 4, cls: 'mono', size: 9.5, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); });
  [[300, 74, 180, 106], [300, 74, 420, 106], [180, 134, 180, 166], [420, 134, 420, 166], [420, 194, 420, 226]].forEach(([a, b, c, e]) => d.line(a, b, c, e, { stroke: C.line, single: true }));
  d.carrow([[460, 240], [520, 160], [360, 40], [220, 170]], { stroke: C.acc, dash: [4, 3] });
  d.mono(320, 296, 'filename="../../../etc/passwd" → join("/srv/wren/uploads", name)', { size: 9.5, color: C.acc });
  d.text(560, 250, 'store under a\ngenerated key:\nu/42/8f3a…jpg', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_os_model() {
  const d = fig('be_os_model', 'OBJECT STORAGE: A BUCKET OF KEYS, EACH POINTING AT IMMUTABLE BYTES AND METADATA', 320);
  bucketObj(d, 40, 70, 220, 200, { label: 'bucket wren-media' });
  ['menu/9/biryani.jpg', 'menu/9/raita.jpg', 'receipts/124.pdf', 'u/42/8f3a.jpg'].forEach((s, i) => d.box(60, 100 + i * 40, 180, 28, s, { r: 4, cls: 'mono', size: 8.5, fill: i === 0 ? C.accSoft : C.paper, stroke: i === 0 ? C.acc : C.line }));
  card(d, 320, 80, 290, ['key   menu/9/biryani.jpg', 'size  412,880 bytes', 'type  image/jpeg', 'etag  "9b2cf535f27731c9"', 'meta  x-amz-meta-restaurant: 9'], { size: 9.5 });
  d.text(465, 220, 'keys look like paths, but there are\nno directories: "/" is just a character', { cls: 'xs', vc: true });
  d.text(465, 266, 'PUT replaces a whole object; reads are\nstrongly consistent on S3 since 2020', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_os_presigned() {
  const d = fig('be_os_presigned', 'PRESIGNED UPLOADS: THE API SIGNS A PERMISSION SLIP, THE BYTES GO STRAIGHT TO STORAGE', 320);
  d.phone(40, 120, 90); d.server(270, 60, 70, 80, { label: 'Wren API' }); bucketObj(d, 480, 150, 120, 110, { label: 'object storage' });
  d.arrow(90, 140, 266, 100, { stroke: C.ink2 }); d.text(170, 98, '1 "I want to upload a photo"', { cls: 'xs' });
  d.arrow(266, 120, 90, 160, { stroke: C.ink2, dash: [4, 3] }); d.text(180, 170, '2 URL valid 5 min, max 10 MB', { cls: 'xs' });
  d.arrow(90, 200, 476, 210, { stroke: C.acc, sw: 2 }); d.text(290, 226, '3 PUT 5 MB directly', { cls: 'xs', color: C.acc });
  d.arrow(476, 170, 344, 110, { stroke: C.gray, dash: [4, 3] }); d.text(440, 120, '4 "object created" event', { cls: 'xs' });
  d.text(320, 300, 'the app never holds the bytes; storage checks the signature, expiry and conditions', { cls: 'xs' });
  return d.svg();
}

export function be_os_through_app() {
  const d = fig('be_os_through_app', 'WHY BIG FILES SHOULD NOT PASS THROUGH THE APP SERVER', 280);
  d.phone(40, 100, 80); d.server(260, 90, 70, 90, { label: 'app worker', fill: C.accSoft, stroke: C.acc }); bucketObj(d, 480, 110, 110, 90, {});
  pipe(d, 86, 256, 135, 14, true); pipe(d, 334, 480, 135, 14);
  hourglass(d, 295, 30, 40, { level: 0.6 });
  d.text(320, 226, '5 MB over a 10 Mbit/s uplink takes 4 s; 500 uploads a minute keeps about 33 workers busy doing nothing but waiting', { cls: 'xs' });
  d.text(320, 252, 'and every byte crosses the app twice, in and out, on the bill', { cls: 'xs' });
  return d.svg();
}

export function be_os_multipart() {
  const d = fig('be_os_multipart', 'MULTIPART UPLOAD: 5 GB AS 50 PARTS OF 100 MB, IN PARALLEL, RETRIED ONE BY ONE', 320);
  for (let i = 0; i < 50; i++) { const x = 40 + (i % 25) * 22, y = 70 + Math.floor(i / 25) * 40; d.during([0.05 + (i % 25) * 0.025 + Math.floor(i / 25) * 0.05, 1], (g) => g.rect(x, y, 18, 30, { r: 2, fill: i === 17 ? C.accSoft : C.card, stroke: i === 17 ? C.acc : C.ink2 })); }
  d.text(400, 166, 'part 17 failed: retry just that part', { cls: 'xs', color: C.acc });
  card(d, 40, 190, 560, ['CreateMultipartUpload → uploadId', 'UploadPart ×50 (parallel, each with its own checksum)', 'CompleteMultipartUpload [ETags of all 50]'], { size: 9.5 });
  d.text(320, 300, 'S3 limits: parts from 5 MiB to 5 GiB, at most 10,000 parts, objects up to 5 TiB', { cls: 'xs' });
  return d.svg();
}

export function be_os_lifecycle() {
  const d = fig('be_os_lifecycle', 'LIFECYCLE RULES: OBJECTS AGE INTO CHEAPER STORAGE OR OUT OF EXISTENCE', 300);
  const X = (dd) => 60 + dd * 5.2;
  [['uploads/tmp/', 0, 1, 'expire after 1 day'], ['incomplete multipart', 0, 7, 'abort after 7 days'], ['receipts/', 0, 30, 'standard 30 days, then infrequent access'], ['photos/originals/', 0, 90, 'archive after 90 days']].forEach(([s, a, b, t], i) => { const y = 80 + i * 44; d.text(50, y, s, { cls: 'mono', size: 9, a: 'end' }); seg(d, X(a) + 10, y, X(b) - X(a), '', { hot: i === 0 }); d.text(X(b) + 18, y, t, { cls: 'xs', a: 'start' }); });
  d.text(320, 274, 'cleanup that nobody has to remember, and storage costs that fall as data cools', { cls: 'xs' });
  return d.svg();
}

export function be_os_processing() {
  const d = fig('be_os_processing', 'AFTER THE UPLOAD: AN EVENT STARTS THE PROCESSING, A CDN SERVES THE RESULTS', 300);
  bucketObj(d, 30, 100, 100, 80, { label: 'originals' });
  d.arrow(134, 140, 194, 140, { stroke: C.gray, hl: 5 }); d.rect(200, 120, 80, 40, { r: 6, fill: C.paper }); for (let k = 0; k < 3; k++) d.envelope(208 + k * 22, 130, 18, 12); d.text(240, 176, 'queue', { cls: 'xs' });
  d.arrow(284, 140, 334, 140, { stroke: C.gray, hl: 5 }); d.gear(360, 140, 22, { spin: 4, stroke: C.acc }); d.text(360, 176, 'thumbnailer', { cls: 'xs' });
  d.arrow(386, 140, 436, 140, { stroke: C.gray, hl: 5 }); bucketObj(d, 440, 100, 80, 80, { label: 'variants' });
  d.cloud(530, 110, 90, 50, { label: 'CDN' });
  d.text(320, 250, '400 px, 800 px and WebP versions under versioned keys, immutable, cached for a year at the edge', { cls: 'xs' });
  return d.svg();
}

export function be_srch_like() {
  const d = fig('be_srch_like', 'THREE WAYS POSTGRESQL CAN ANSWER "MENU ITEMS LIKE BIRYANI"', 320);
  panel(d, 20, 40, 190, 250, "LIKE '%biryani%'", true); panel(d, 225, 40, 190, 250, "LIKE 'biryani%'"); panel(d, 430, 40, 190, 250, 'trigram index');
  for (let i = 0; i < 40; i++) d.rect(40 + (i % 8) * 19, 80 + Math.floor(i / 8) * 22, 15, 16, { r: 1, fill: C.accSoft, stroke: C.acc, sw: 0.5 });
  d.text(115, 210, 'reads all 100,000 rows;\nno B-tree can help a\nleading wildcard', { cls: 'xs', vc: true });
  for (let i = 0; i < 40; i++) d.rect(245 + (i % 8) * 19, 80 + Math.floor(i / 8) * 22, 15, 16, { r: 1, fill: i >= 17 && i < 20 ? C.accSoft : C.paper, stroke: i >= 17 && i < 20 ? C.acc : C.line, sw: 0.5 });
  d.text(320, 210, 'a B-tree range scan with\ntext_pattern_ops; only\nprefixes', { cls: 'xs', vc: true });
  d.chips(445, 90, ['bir', 'iry', 'rya', 'yan', 'ani'], { h: 22, size: 9, gap: 3 });
  d.text(525, 210, 'pg_trgm GIN index finds\nrows sharing trigrams;\nfuzzy, typo-tolerant', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_srch_pg_fts() {
  const d = fig('be_srch_pg_fts', 'POSTGRESQL FULL-TEXT SEARCH: A TSVECTOR PER ROW, A GIN INDEX OVER THEM', 300);
  card(d, 20, 50, 600, ["to_tsvector('english', 'Chicken Biryani with spiced basmati rice')", "→ 'basmati':5 'biryani':2 'chicken':1 'rice':6 'spice':4", "WHERE search @@ websearch_to_tsquery('english', 'chicken biryani')", "ORDER BY ts_rank(search, query) DESC"], { size: 9.5, hot: [1] });
  d.text(320, 180, 'stemmed, stop words removed, positions kept; a GIN index maps each lexeme to its rows', { cls: 'sm' });
  d.text(320, 212, 'good enough for many products, with no extra system to run and transactional consistency for free', { cls: 'xs' });
  return d.svg();
}

export function be_srch_analyzer() {
  const d = fig('be_srch_analyzer', 'AN ANALYZER TURNS TEXT INTO TERMS, AND THE SAME ONE RUNS ON QUERIES', 320);
  d.mono(320, 52, '"Crème Brûlée & the Spiciest Biryanis!"', { size: 11 });
  const st = [['tokenize', ['Crème', 'Brûlée', 'the', 'Spiciest', 'Biryanis']], ['lowercase', ['crème', 'brûlée', 'the', 'spiciest', 'biryanis']], ['ASCII fold', ['creme', 'brulee', 'the', 'spiciest', 'biryanis']], ['stop words', ['creme', 'brulee', 'spiciest', 'biryanis']], ['stem', ['creme', 'brule', 'spici', 'biryani']]];
  st.forEach(([t, toks], i) => { const y = 82 + i * 44; d.text(100, y + 12, t, { cls: 'sm', a: 'end' }); d.chips(116, y, toks, { h: 24, size: 9.5, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 }); });
  return d.svg();
}

export function be_srch_inverted() {
  const d = fig('be_srch_inverted', 'AN INVERTED INDEX: EACH TERM POINTS TO THE DOCUMENTS, AND POSITIONS, THAT CONTAIN IT', 320);
  [['biryani', [[17, '2'], [203, '1,7'], [911, '3']]], ['chicken', [[17, '1'], [88, '4'], [203, '6'], [640, '1']]], ['paneer', [[52, '1'], [911, '1']]], ['raita', [[17, '5'], [203, '9']]]].forEach(([t, posts], i) => { const y = 70 + i * 56; d.box(40, y - 16, 110, 32, t, { r: 4, cls: 'mono', size: 10, fill: i < 2 ? C.accSoft : C.card, stroke: i < 2 ? C.acc : C.ink2 }); d.arrow(154, y, 190, y, { stroke: C.gray, hl: 5 }); posts.forEach(([doc, pos], k) => d.box(196 + k * 100, y - 16, 92, 32, `doc ${doc} @${pos}`, { r: 4, cls: 'mono', size: 8.5, fill: C.paper })); });
  d.text(320, 300, '"chicken biryani" intersects two posting lists: docs 17 and 203; sorted ids make intersection a merge', { cls: 'xs' });
  return d.svg();
}

export function be_srch_phrase() {
  const d = fig('be_srch_phrase', 'A PHRASE QUERY NEEDS POSITIONS: "CHICKEN BIRYANI" MEANS BIRYANI RIGHT AFTER CHICKEN', 280);
  d.text(40, 70, 'doc 17', { cls: 'ttl', a: 'start' }); d.chips(110, 56, ['chicken', 'biryani', 'with', 'spiced', 'raita'], { h: 26, size: 9.5, fill: (i) => (i < 2 ? C.accSoft : C.card), stroke: (i) => (i < 2 ? C.acc : C.ink2) }); tick(d, 560, 70, 8);
  d.text(40, 140, 'doc 203', { cls: 'ttl', a: 'start' }); d.chips(110, 126, ['biryani', 'and', 'kebabs', 'for', 'the', 'chicken', 'lover'], { h: 26, size: 9.5, fill: (i) => ([0, 5].includes(i) ? C.slateSoft : C.card) }); cross(d, 590, 140, 8);
  d.text(320, 210, 'both docs contain both words; only doc 17 has position(biryani) = position(chicken) + 1', { cls: 'sm' });
  return d.svg();
}

export function be_srch_bm25() {
  const d = fig('be_srch_bm25', 'BM25 FOR "CHICKEN BIRYANI" ON ONE MENU ITEM, WORKED THROUGH', 330);
  card(d, 20, 50, 600, ['N = 100,000 items; df(biryani) = 400; df(chicken) = 9,000', 'IDF = ln(1 + (N − df + 0.5) ÷ (df + 0.5)) → biryani 5.52, chicken 2.41', 'doc 17: tf(biryani) = 2, tf(chicken) = 1, length 12, average length 20, k1 = 1.2, b = 0.75', 'tf part = tf (k1 + 1) ÷ (tf + k1 (1 − b + b · 12 ÷ 20)) → biryani 1.55, chicken 1.20', 'score = 5.52 × 1.55 + 2.41 × 1.20 = 11.43'], { size: 9.5, hot: [4] });
  d.text(320, 200, 'rare terms weigh more; repeated terms help less and less; short documents get a small boost', { cls: 'sm' });
  d.text(320, 230, 'a 30-term item mentioning biryani once scores 4.58: no chicken, and a longer text', { cls: 'xs' });
  return d.svg();
}

export function be_srch_saturation() {
  const d = fig('be_srch_saturation', 'TERM FREQUENCY: TF-IDF KEEPS CLIMBING, BM25 LEVELS OFF', 300);
  const M = d.axes(80, 50, 460, 190, { xmin: 0, xmax: 20, ymin: 0, ymax: 4, xl: 'times the term appears', yl: 'weight' });
  d.fn((t) => Math.min(4, t * 0.2), 0, 20, M, { stroke: C.slate, dash: [5, 4] });
  d.fn((t) => (t * 2.2) / (t + 1.2), 0, 20, M);
  d.text(M.X(16), M.Y(3.4), 'linear tf', { cls: 'xs', a: 'end' }); d.text(M.X(18), M.Y(2.25), 'BM25: approaches k1 + 1 = 2.2', { cls: 'xs', a: 'end', color: C.acc });
  d.text(320, 282, 'stuffing "biryani" twenty times into a description does not buy twenty times the rank', { cls: 'xs' });
  return d.svg();
}

export function be_es_shards() {
  const d = fig('be_es_shards', 'AN INDEX SPLIT INTO SHARDS, EACH WITH A REPLICA ON ANOTHER NODE', 320);
  [0, 1, 2].forEach((n) => { const x = 40 + n * 200; d.rect(x, 80, 170, 170, { r: 10, fill: C.paper }); d.text(x + 85, 98, `node ${n + 1}`, { cls: 'ttl', size: 11 }); });
  [['P0', 0, 0], ['R1', 0, 1], ['P1', 1, 0], ['R2', 1, 1], ['P2', 2, 0], ['R0', 2, 1]].forEach(([s, n, k]) => d.box(60 + n * 200, 120 + k * 60, 130, 44, s, { r: 6, cls: 'mono', size: 11, fill: s[0] === 'P' ? C.accSoft : C.card, stroke: s[0] === 'P' ? C.acc : C.ink2 }));
  d.text(320, 286, 'primaries (orange) take writes; any copy serves reads; losing a node loses no shard', { cls: 'xs' });
  return d.svg();
}

export function be_es_segments() {
  const d = fig('be_es_segments', 'INSIDE A SHARD: IMMUTABLE SEGMENTS, A REFRESH EVERY SECOND, BACKGROUND MERGES', 300);
  d.rect(40, 80, 120, 60, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(100, 110, 'in-memory buffer', { cls: 'xs', color: C.acc });
  d.arrow(164, 110, 214, 110, { stroke: C.acc }); d.text(190, 96, 'refresh 1 s', { cls: 'xs' });
  [0, 1, 2, 3].forEach((i) => d.rect(220 + i * 50, 90, 40, 40, { r: 3, fill: C.card }));
  d.carrow([[300, 140], [360, 190], [440, 140]], { stroke: C.gray, dash: [3, 3] }); d.rect(440, 80, 110, 60, { r: 6, fill: C.card }); d.text(495, 110, 'merged segment', { cls: 'xs' });
  d.text(320, 230, 'new documents become searchable at refresh, about 1 s: near real time, not immediate', { cls: 'sm' });
  d.text(320, 258, 'deletes mark documents; merges reclaim them; a translog makes writes durable between commits', { cls: 'xs' });
  return d.svg();
}

export function be_es_pipeline() {
  const d = fig('be_es_pipeline', 'THE INDEXING PIPELINE: THE DATABASE STAYS THE TRUTH, THE INDEX FOLLOWS', 300);
  d.db(20, 100, 90, 80, { label: 'PostgreSQL' }); d.gear(150, 140, 16, { spin: 4 }); d.text(150, 170, 'CDC', { cls: 'xs' });
  pipe(d, 170, 330, 140, 22); d.text(250, 124, 'menu-events', { cls: 'mono', size: 9 });
  d.gear(370, 140, 20, { spin: 4, stroke: C.acc }); d.text(370, 174, 'indexer', { cls: 'xs', color: C.acc });
  d.db(430, 100, 110, 80, { label: 'search\nindex', stroke: C.acc });
  for (let i = 0; i < 3; i++) d.travel([[176, 140], [326, 140]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.4] });
  d.text(320, 230, 'a price change appears in search about 1 to 2 s later; the menu page reads the database', { cls: 'sm' });
  d.text(320, 258, 'indexers upsert by id with the source version, so replays and reorderings are harmless', { cls: 'xs' });
  return d.svg();
}

export function be_es_alias() {
  const d = fig('be_es_alias', 'REINDEX WITHOUT DOWNTIME: BUILD BESIDE, THEN SWING THE ALIAS', 300);
  signpost(d, 320, 90, 'menu (alias)', { hot: true, w: 130 });
  d.db(100, 160, 120, 80, { label: 'menu_v7' }); d.db(420, 160, 120, 80, { label: 'menu_v8\nnew mapping', stroke: C.acc });
  d.during([0, 0.5], (g) => g.arrow(300, 140, 200, 166, { stroke: C.ink2 }));
  d.during([0.5, 1], (g) => g.arrow(340, 140, 440, 166, { stroke: C.acc }));
  d.text(320, 274, 'backfill v8 from the database, dual-write new changes, swap atomically, keep v7 for rollback', { cls: 'xs' });
  return d.svg();
}

export function be_es_tail() {
  const d = fig('be_es_tail', 'SCATTER-GATHER: A QUERY IS AS SLOW AS ITS SLOWEST SHARD', 300);
  d.rect(40, 120, 90, 60, { r: 8, fill: C.card }); d.text(85, 150, 'coordinator', { cls: 'xs' });
  for (let i = 0; i < 10; i++) { const y = 50 + i * 22; d.line(134, 150, 300, y, { stroke: i === 6 ? C.acc : C.line, single: true }); d.rect(300, y - 8, i === 6 ? 220 : 60 + (i * 13) % 40, 16, { r: 2, fill: i === 6 ? C.accSoft : C.card, stroke: i === 6 ? C.acc : C.ink2 }); }
  d.text(560, 190, 'shard 7 is slow', { cls: 'xs', color: C.acc });
  d.text(320, 276, 'if each of 10 shards is under its p99 99% of the time, 1 − 0.99¹⁰ = 9.6% of queries wait on a slow one', { cls: 'xs' });
  return d.svg();
}

export function be_vec_embed() {
  const d = fig('be_vec_embed', 'EMBEDDINGS PUT SIMILAR MEANINGS NEAR EACH OTHER (A 2D SKETCH OF 768 DIMENSIONS)', 320);
  d.rect(40, 50, 380, 240, { r: 8, fill: C.paper });
  [['chicken biryani', 120, 110], ['hyderabadi dum biryani', 160, 90], ['pulao', 180, 140], ['mutton biryani', 110, 150], ['margherita pizza', 340, 230], ['pepperoni pizza', 370, 200], ['gulab jamun', 300, 90]].forEach(([s, x, y], i) => { d.dot(x, y, 5, i < 4 ? C.acc : C.ink2); d.text(x + 8, y - 8, s, { cls: 'xs', a: 'start' }); });
  d.circle(140, 120, 120, { stroke: C.acc, dash: [4, 3] }); d.text(140, 196, 'query: "spicy rice dish"', { cls: 'xs', color: C.acc });
  d.text(530, 110, 'cosine similarity:\ncos θ = a·b ÷ (|a||b|)', { cls: 'mono', size: 9.5, vc: true });
  d.text(530, 190, '100,000 items × 768 floats\n× 4 bytes = 307.2 MB', { cls: 'mono', size: 9.5, vc: true });
  d.text(530, 250, 'brute force: 76.8 million\nmultiply-adds per query', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_vec_hnsw() {
  const d = fig('be_vec_hnsw', 'HNSW: A FEW LONG HOPS ON THE TOP LAYER, THEN SHORTER ONES BELOW', 340);
  const layers = [[[100, 300], [500, 300]], [[100, 300], [250, 300], [400, 300], [540, 300]], [[80, 300], [150, 300], [220, 300], [290, 300], [360, 300], [430, 300], [500, 300], [570, 300]]];
  layers.forEach((pts, L) => { const y = 70 + L * 100; d.text(30, y, `L${2 - L}`, { cls: 'mono', size: 9 }); pts.forEach(([x], k) => { d.circle(x, y, 18, { fill: C.card, stroke: C.ink2 }); if (k) d.line(pts[k - 1][0] + 9, y, x - 9, y, { stroke: C.line, single: true }); }); });
  d.circle(400, 270, 22, { fill: C.accSoft, stroke: C.acc }); d.text(400, 300, 'nearest', { cls: 'xs', color: C.acc });
  d.carrow([[100, 70], [300, 50], [500, 70]], { stroke: C.acc }); d.arrow(500, 80, 400, 160, { stroke: C.acc }); d.arrow(400, 180, 430, 260, { stroke: C.acc }); d.arrow(420, 270, 410, 270, { stroke: C.acc });
  d.text(320, 326, 'approximate: about log n hops instead of n comparisons, with recall tuned by ef_search', { cls: 'xs' });
  return d.svg();
}

export function be_vec_hybrid() {
  const d = fig('be_vec_hybrid', 'HYBRID RETRIEVAL: KEYWORDS AND VECTORS EACH NOMINATE, RRF MERGES, A RERANKER DECIDES', 340);
  card(d, 20, 50, 180, ['BM25', '1 chicken biryani', '2 biryani combo', '3 veg biryani'], { size: 9.5 });
  card(d, 20, 170, 180, ['vectors', '1 hyderabadi dum', '2 chicken pulao', '3 chicken biryani'], { size: 9.5 });
  d.arrow(204, 100, 260, 150, { stroke: C.gray }); d.arrow(204, 220, 260, 170, { stroke: C.gray });
  d.rect(264, 120, 120, 80, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(324, 150, 'RRF k = 60', { cls: 'ttl', size: 11, color: C.acc }); d.text(324, 172, 'Σ 1 ÷ (k + rank)', { cls: 'mono', size: 9 });
  d.arrow(388, 160, 430, 160, { stroke: C.acc }); d.gear(460, 160, 22, { spin: 5 }); d.text(460, 196, 'reranker (top 50)', { cls: 'xs' });
  d.text(320, 260, 'chicken biryani: 1 ÷ 61 + 1 ÷ 63 = 0.0323, ahead of anything ranked high in only one list', { cls: 'mono', size: 9.5 });
  d.text(320, 292, 'keywords catch exact names and codes; vectors catch meaning; the reranker reads both with the query', { cls: 'xs' });
  return d.svg();
}

export function be_rt_e2e() {
  const d = fig('be_rt_e2e', 'ONE EVENING IN THE APP: TRACK, UPLOAD, SEARCH', 340);
  panel(d, 20, 40, 190, 260, 'track order 124'); panel(d, 225, 40, 190, 260, 'upload a photo', true); panel(d, 430, 40, 190, 260, 'search "biryani"');
  ['ticket → wss', 'subscribe order:124', 'status via pub/sub', 'resume on reconnect'].forEach((s, i) => { d.circle(60, 90 + i * 50, 22, { fill: C.card, stroke: C.ink2 }); d.mono(60, 90 + i * 50, i + 1, { size: 9 }); d.text(80, 90 + i * 50, s, { cls: 'xs', a: 'start' }); });
  ['presigned PUT', 'scan + re-encode', 'thumbnails', 'CDN URL'].forEach((s, i) => { d.circle(265, 90 + i * 50, 22, { fill: C.accSoft, stroke: C.acc }); d.mono(265, 90 + i * 50, i + 1, { size: 9 }); d.text(285, 90 + i * 50, s, { cls: 'xs', a: 'start' }); });
  ['analyze query', 'BM25 + vectors', 'RRF + rerank', 'filter open, near'].forEach((s, i) => { d.circle(470, 90 + i * 50, 22, { fill: C.card, stroke: C.ink2 }); d.mono(470, 90 + i * 50, i + 1, { size: 9 }); d.text(490, 90 + i * 50, s, { cls: 'xs', a: 'start' }); });
  d.text(320, 322, 'none of the three puts large or long-lived work on the API servers themselves', { cls: 'xs' });
  return d.svg();
}

export function be_rt_components() {
  const d = fig('be_rt_components', 'THE UNIT ON ONE PAGE', 320);
  d.phone(50, 60, 110); pipe(d, 110, 200, 115, 16, true); d.text(130, 200, 'realtime', { cls: 'sm' });
  bucketObj(d, 250, 70, 110, 100, { label: '' }); d.text(305, 200, 'uploads and storage', { cls: 'sm' });
  magnifier(d, 470, 110, 40, { stroke: C.acc }); d.text(480, 200, 'search', { cls: 'sm' });
  d.text(320, 246, 'connections are state to scale and protect; files go around the app; the index follows the database', { cls: 'sm' });
  d.text(320, 276, 'each is a different shape of data leaving the request-response box', { cls: 'xs' });
  return d.svg();
}

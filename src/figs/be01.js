import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser, hourglass, signpost, gauge, bubble, seg, lanes } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['HTTP messages', 'HTTP methods and idempotency', 'HTTP status codes', 'HTTP caching headers', 'HTTP/1.1, HTTP/2 and HTTP/3', 'TLS and the handshake', 'Certificates and trust', 'DNS for backend engineers', 'The HTTPS request end to end'];
function letter(d, x, y, w, lines, o = {}) {
  const h = o.h ?? 26 + lines.length * 18;
  d.doc(x, y, w, h, { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2, lines: false });
  lines.forEach((s, i) => { if (s) d.mono(x + 12, y + 20 + i * 18, s, { a: 'start', size: o.size ?? 9.5, color: o.hot?.includes(i) ? C.acc : undefined }); });
  return h;
}

function wire(d, x1, x2, y, o = {}) {
  d.line(x1, y - 6, x2, y - 6, { stroke: C.ink2, single: true, sw: 0.9 });
  d.line(x1, y + 6, x2, y + 6, { stroke: C.ink2, single: true, sw: 0.9 });
  if (o.label) d.text((x1 + x2) / 2, y - 18, o.label, { cls: 'xs' });
}

function packet(d, x, y, label, o = {}) {
  d.envelope(x - 22, y - 14, 44, 28, { fill: o.hot ? C.accSoft : (o.fill ?? C.card), stroke: o.hot ? C.acc : (o.stroke ?? C.ink2) });
  if (label) d.mono(x, y + 24, label, { size: 8.5, color: o.hot ? C.acc : undefined });
}

function cert(d, x, y, w, h, o = {}) {
  d.rect(x, y, w, h, { r: 4, fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2 });
  d.rect(x + 5, y + 5, w - 10, h - 10, { r: 2, stroke: C.line, sw: 0.8 });
  d.circle(x + w - 18, y + h - 18, 20, { fill: C.accSoft, stroke: C.acc });
  d.poly([[x + w - 24, y + h - 10], [x + w - 28, y + h + 4], [x + w - 18, y + h - 2], [x + w - 8, y + h + 4], [x + w - 12, y + h - 10]], { fill: C.accSoft, stroke: C.acc, sw: 0.8 });
  if (o.label) d.mono(x + w / 2 - 10, y + 22, o.label, { size: 9 });
}

export const where_be_http = (stage = 99) => beMap('where_be_http', PARTS, stage);

export const cover_be_http = () => beCover('cover_be_http', 'I', ['HTTP, TLS', 'and DNS'], 'How one request finds the server, proves it, and asks', (d, y) => {
  browser(d, 40, y + 40, 200, 130, 'https://api.wren.example/orders/123', { urlColor: C.acc });
  d.mono(140, y + 95, 'GET /orders/123', { size: 11 });
  d.lock(132, y + 115, 18, { fill: C.accSoft, stroke: C.acc });
  d.server(470, y + 30, 110, 150, { led: (i) => i === 2 });
  d.flowline([[245, y + 100], [460, y + 100]], { color: C.acc, sw: 1.6 });
  d.travel([[250, y + 100], [455, y + 100]], { token: 'packet', dur: 3 });
  ['DNS', 'TCP', 'TLS', 'HTTP'].forEach((s, i) => { d.box(250 + i * 52, y + 200, 46, 28, s, { r: 5, cls: 'mono', size: 10, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); });
  d.text(353, y + 248, 'four layers, one request', { cls: 'sm' });
}, [['HTTP', 'methods, codes, caching, versions'], ['TLS', 'handshake, keys, certificates'], ['DNS', 'records, TTLs, routing'], ['End to end', 'every round trip counted']]);

export function be_http_lifecycle() {
  const d = fig('be_http_lifecycle', 'ONE REQUEST, ONE RESPONSE, ON A CONNECTION THAT MAY OUTLIVE BOTH', 300);
  const xs = actors(d, ['client', 'connection', 'Wren server'], 46, 270, { x0: 90, x1: 550, hot: 2 });
  say(d, xs[0], xs[1], 100, 'open (TCP + TLS)');
  say(d, xs[0], xs[2], 140, 'GET /orders/123', { hot: true });
  d.rect(xs[2] - 40, 152, 80, 50, { r: 5, fill: C.accFaint, stroke: C.acc });
  d.text(xs[2], 177, 'route, auth,\nquery, render', { cls: 'xs', vc: true });
  say(d, xs[2], xs[0], 224, '200 OK + 2,000 B body');
  d.text(320, 254, 'the connection stays open for the next request', { cls: 'xs' });
  return d.svg();
}

export function be_http_wire() {
  const d = fig('be_http_wire', 'WHAT ACTUALLY CROSSES THE WIRE IN HTTP/1.1: LINES OF TEXT', 320);
  letter(d, 20, 50, 270, ['GET /orders/123 HTTP/1.1', 'Host: api.wren.example', 'Accept: application/json', 'Authorization: Bearer eyJ…', '', '(no body)'], { hot: [0] });
  letter(d, 350, 50, 270, ['HTTP/1.1 200 OK', 'Content-Type: application/json', 'Content-Length: 2000', 'Cache-Control: private, max-age=0', '', '{"id":123,"status":"paid",…}'], { hot: [0] });
  wire(d, 290, 350, 100); d.travel([[290, 100], [350, 100]], { token: (dd) => dd.dot(0, 0, 3, C.acc) });
  d.text(155, 212, 'request', { cls: 'ttl' }); d.text(485, 212, 'response', { cls: 'ttl' });
  d.line(30, 140, 280, 140, { stroke: C.acc, dash: [3, 3], single: true }); d.text(155, 250, 'a blank line ends the headers', { cls: 'xs', color: C.acc });
  d.hand(470, 270, 'start line, headers, blank line, body', { size: 15 });
  return d.svg();
}

export function be_http_anatomy() {
  const d = fig('be_http_anatomy', 'THE START LINE NAMES THE ACTION; THE STATUS LINE NAMES THE OUTCOME', 300);
  d.envelope(30, 50, 280, 90, {}); d.mono(60, 120, 'POST', { size: 13, a: 'start', color: C.acc }); d.mono(120, 120, '/orders?src=app', { size: 12, a: 'start' }); d.mono(250, 120, 'HTTP/1.1', { size: 10, a: 'start' });
  d.text(76, 156, 'method', { cls: 'xs', color: C.acc }); d.text(176, 156, 'request target', { cls: 'xs' }); d.text(276, 156, 'version', { cls: 'xs' });
  d.doc(360, 50, 250, 110, { fill: C.paper, lines: false }); d.mono(380, 90, 'HTTP/1.1', { size: 10, a: 'start' }); d.text(500, 90, '201', { cls: 'mono', size: 28, color: C.acc }); d.mono(560, 90, 'Created', { size: 10, a: 'start' });
  d.text(400, 176, 'version', { cls: 'xs' }); d.text(500, 176, 'status code', { cls: 'xs', color: C.acc }); d.text(580, 176, 'reason', { cls: 'xs' });
  d.text(170, 196, 'request line', { cls: 'ttl' }); d.text(485, 210, 'status line', { cls: 'ttl' });
  d.text(320, 270, 'clients branch on the number; the phrase is for humans and HTTP/2 drops it', { cls: 'xs' });
  return d.svg();
}

export function be_http_framing() {
  const d = fig('be_http_framing', 'TWO WAYS TO SAY WHERE THE BODY ENDS', 320);
  panel(d, 20, 40, 290, 250, 'Content-Length: 2000');
  d.rect(50, 100, 230, 50, { r: 3, fill: C.card, stroke: C.ink2 }); for (let i = 0; i < 20; i++) d.line(56 + i * 11, 106, 56 + i * 11, 144, { stroke: C.line, single: true, sw: 0.6 });
  d.brace(50, 280, 160, { label: 'reader counts exactly 2,000 bytes' });
  d.line(50, 200, 280, 200, { stroke: C.ink2, single: true }); [0, 1, 2, 3, 4].forEach((k) => d.line(50 + k * 57.5, 196, 50 + k * 57.5, 204, { stroke: C.ink2, single: true }));
  d.text(165, 250, 'size must be known before sending', { cls: 'xs' });
  panel(d, 330, 40, 290, 250, 'Transfer-Encoding: chunked', true);
  [['7d0', 60], ['400', 40], ['0', 10]].forEach(([h, w], i) => { const y = 90 + i * 50; d.rect(350, y, 46, 30, { r: 3, fill: C.accSoft, stroke: C.acc }); d.mono(373, y + 15, h, { size: 10, color: C.acc }); d.rect(400, y, w * 3, 30, { r: 3, fill: i === 2 ? C.paper : C.card, stroke: C.ink2 }); });
  d.travel([[350, 105], [590, 105]], { token: (dd) => dd.rect(-6, -6, 12, 12, { r: 2, fill: C.accSoft, stroke: C.acc }), at: [0, 0.3] });
  d.text(475, 250, 'hex size, data, … a zero-size chunk ends it', { cls: 'xs' });
  return d.svg();
}

export function be_http_encoding() {
  const d = fig('be_http_encoding', 'CONTENT NEGOTIATION: THE CLIENT OFFERS, THE SERVER PICKS AND LABELS', 300);
  d.phone(30, 70, 90); bubble(d, 90, 50, 200, 64, 'Accept: application/json\nAccept-Encoding: gzip, br', { cls: 'mono', size: 9, tx: 100, ty: 120 });
  d.server(500, 70, 90, 110, {});
  d.rect(330, 160, 70, 50, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(365, 185, 'JSON', { cls: 'xs' }); d.arrow(404, 185, 430, 185, { stroke: C.gray, hl: 5 }); d.rect(434, 170, 40, 30, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(454, 185, 'br', { cls: 'xs', color: C.acc });
  card(d, 300, 230, 320, ['Content-Type: application/json', 'Content-Encoding: br', 'Vary: Accept-Encoding'], { size: 9, hot: [1, 2], bold: false });
  d.text(160, 270, 'Type: what the bytes mean', { cls: 'xs' }); d.text(160, 288, 'Encoding: how they were squeezed', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_http_client_headers() {
  const d = fig('be_http_client_headers', 'ONE IP ADDRESS, MANY SITES: THE HOST HEADER PICKS THE VIRTUAL HOST', 300);
  d.server(270, 90, 100, 130, { label: '203.0.113.10' });
  [['Host: api.wren.example', 60, true], ['Host: www.wren.example', 150, false], ['Host: admin.wren.example', 240, false]].forEach(([s, y, hot]) => {
    d.mono(20, y, s, { a: 'start', size: 10, color: hot ? C.acc : undefined });
    d.arrow(170, y, 262, 150, { stroke: hot ? C.acc : C.gray, hl: 6 });
  });
  ['api app', 'web app', 'admin app'].forEach((s, i) => { d.box(450, 70 + i * 70, 140, 42, s, { r: 6, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.arrow(374, 150, 446, 91 + i * 70, { stroke: i === 0 ? C.acc : C.line, hl: 5 }); });
  return d.svg();
}

export function be_http_methods() {
  const d = fig('be_http_methods', 'FIVE VERBS AGAINST ONE RESOURCE, /orders/123', 320);
  d.doc(270, 120, 100, 120, { fill: C.accFaint, stroke: C.acc });
  d.mono(320, 255, '/orders/123', { size: 10 });
  const v = [['GET', 'read it', 100, 60], ['PUT', 'replace it', 540, 60], ['PATCH', 'change fields', 540, 180], ['DELETE', 'remove it', 540, 290], ['POST /orders', 'create a new one', 100, 250]];
  v.forEach(([m, s, x, y]) => {
    d.box(x - 60, y - 20, 120, 40, m, { r: 6, cls: 'mono', size: 11, fill: C.card });
    d.text(x, y + 30, s, { cls: 'xs' });
    d.arrow(x < 320 ? x + 64 : x - 64, y, x < 320 ? 264 : 376, 180, { stroke: C.gray, hl: 6 });
  });
  return d.svg();
}

export function be_http_connect() {
  const d = fig('be_http_connect', 'CONNECT TURNS A PROXY INTO A BLIND TUNNEL; OPTIONS ASKS WHAT IS ALLOWED', 280);
  d.laptop(20, 80, 100, { label: 'client' });
  d.rect(250, 70, 120, 90, { r: 7, fill: C.card, stroke: C.ink2 }); d.text(310, 92, 'forward proxy', { cls: 'sm' });
  d.server(520, 70, 80, 100, { label: 'api.wren.example' });
  say(d, 126, 246, 120, 'CONNECT :443');
  d.text(310, 130, '200 tunnel', { cls: 'mono', size: 9.5 });
  d.flowline([[126, 200], [600, 200]], { color: C.acc });
  d.lock(300, 190, 18, { fill: C.accSoft, stroke: C.acc });
  d.text(320, 240, 'encrypted TLS bytes pass through; the proxy cannot read them', { cls: 'xs' });
  return d.svg();
}

export function be_http_safe_idem() {
  const d = fig('be_http_safe_idem', 'SAFE MEANS NO INTENDED CHANGE; IDEMPOTENT MEANS REPEATS LAND IN THE SAME STATE', 330);
  const G = [['GET', 2], ['HEAD', 2], ['OPTIONS', 2], ['PUT', 1], ['DELETE', 1], ['PATCH', 0], ['POST', 0]];
  d.circle(230, 180, 300, { fill: C.paper, stroke: C.ink2 }); d.circle(180, 180, 170, { fill: C.accFaint, stroke: C.acc });
  d.text(230, 44, 'idempotent', { cls: 'ttl' }); d.text(180, 112, 'safe', { cls: 'ttl', color: C.acc });
  G.forEach(([m, k], i) => { const pos = k === 2 ? [[150, 150], [210, 180], [160, 215]][i] : k === 1 ? [[310, 150], [320, 220]][i - 3] : [[470, 150], [470, 220]][i - 5]; d.mono(pos[0], pos[1], m, { size: 12, color: k === 2 ? C.acc : undefined, w: 600 }); });
  d.text(520, 110, 'outside both', { cls: 'xs' });
  d.text(520, 270, 'PATCH can be idempotent if it sets values;', { cls: 'xs' }); d.text(520, 288, 'POST needs a key', { cls: 'xs' });
  return d.svg();
}

export function be_http_retry_ambiguity() {
  const d = fig('be_http_retry_ambiguity', 'THE RESPONSE WAS LOST, NOT THE REQUEST: A BLIND RETRY CHARGES TWICE', 300);
  const xs = actors(d, ['mobile app', 'Wren API', 'payments'], 44, 280, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 96, 'POST /payments 450');
  say(d, xs[1], xs[2], 126, 'charge 450');
  say(d, xs[1], xs[0] + 140, 156, '201 Created');
  cross(d, xs[0] + 120, 156, 8);
  d.text(xs[0] + 40, 176, 'timeout', { cls: 'xs' });
  say(d, xs[0], xs[1], 206, 'POST /payments 450 (retry)', { hot: true });
  say(d, xs[1], xs[2], 236, 'charge 450 again', { hot: true });
  d.hand(470, 270, 'customer pays 900');
  return d.svg();
}

export function be_http_idem_key() {
  const d = fig('be_http_idem_key', 'AN IDEMPOTENCY KEY TURNS THE RETRY INTO A LOOKUP', 300);
  card(d, 20, 50, 250, ['POST /payments', 'Idempotency-Key: 7f3a', '{"amount":450}'], { hot: [1] });
  d.arrow(280, 90, 340, 90, { stroke: C.gray });
  d.db(350, 50, 110, 90, { label: 'keys' });
  d.mono(405, 160, '7f3a -> 201, pay_88', { size: 9.5 });
  panel(d, 480, 50, 140, 200, 'second arrival', true);
  d.text(550, 110, 'key exists', { cls: 'sm' });
  d.text(550, 140, 'return stored\n201, pay_88', { cls: 'mono', size: 9.5, vc: true });
  d.text(550, 190, 'no new charge', { cls: 'sm', color: C.acc });
  d.text(240, 250, 'first arrival: run it, store the outcome under the key', { cls: 'xs' });
  return d.svg();
}

export function be_http_2xx() {
  const d = fig('be_http_2xx', 'FIVE WAYS TO SUCCEED, EACH TELLING THE CLIENT SOMETHING DIFFERENT', 300);
  const c = [['200', 'OK', 'here is the result'], ['201', 'Created', 'see Location'], ['202', 'Accepted', 'queued, not done'], ['204', 'No Content', 'done, no body'], ['206', 'Partial', 'the range asked']];
  c.forEach(([n, s, t], i) => { const x = 70 + i * 124, hot = i === 2;
    if (i === 0) d.doc(x - 22, 60, 44, 56, { fill: C.card }); if (i === 1) { d.doc(x - 22, 60, 44, 56, { fill: C.card }); d.text(x + 18, 66, '+', { size: 18 }); } if (i === 2) { d.rect(x - 26, 70, 52, 40, { r: 3, fill: C.accSoft, stroke: C.acc }); hourglass(d, x, 74, 32, { level: 0.3, stroke: C.acc }); } if (i === 3) { d.envelope(x - 22, 72, 44, 30, {}); tick(d, x, 86, 6, C.ink2); } if (i === 4) { d.doc(x - 22, 60, 44, 56, { fill: C.paper }); d.fillRect(x - 18, 80, 36, 14, C.accSoft); }
    d.text(x, 146, n, { cls: 'mono', size: 20, color: hot ? C.acc : undefined }); d.text(x, 172, s, { cls: 'ttl', size: 11 }); d.text(x, 194, t, { cls: 'xs' }); });
  return d.svg();
}

export function be_http_202() {
  const d = fig('be_http_202', '202 ACCEPTED: ANSWER NOW, FINISH LATER, LET THE CLIENT CHECK', 300);
  const xs = actors(d, ['client', 'Wren API', 'worker'], 44, 280, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 96, 'POST /reports');
  say(d, xs[1], xs[0], 126, '202 + Location: /jobs/9', { hot: true });
  say(d, xs[1], xs[2], 156, 'enqueue job 9', { dash: [4, 4] });
  say(d, xs[0], xs[1], 196, 'GET /jobs/9');
  say(d, xs[1], xs[0], 222, '200 {"state":"running"}');
  say(d, xs[0], xs[1], 254, 'GET /jobs/9 (later)');
  d.text(xs[0] + 40, 272, '303 See Other: /reports/9', { cls: 'mono', size: 9, a: 'start', color: C.acc });
  return d.svg();
}

export function be_http_redirects() {
  const d = fig('be_http_redirects', 'REDIRECTS DIFFER ON TWO QUESTIONS: PERMANENT? AND MAY THE METHOD CHANGE?', 320);
  d.text(270, 52, 'method may become GET', { cls: 'ttl' }); d.text(490, 52, 'method and body kept', { cls: 'ttl' });
  d.text(100, 110, 'temporary', { cls: 'ttl', a: 'end' }); d.text(100, 200, 'permanent', { cls: 'ttl', a: 'end' });
  const cell = (x, y, code, note, hot, perm) => { signpost(d, x + 90, y + 34, code, { hot, pole: 22, w: 110 }); if (perm) d.rect(x + 60, y + 58, 60, 6, { r: 1, fill: C.ink2 }); else d.dot(x + 90, y + 60, 3, C.gray); d.text(x + 90, y + 78, note, { cls: 'xs' }); };
  cell(180, 66, '302 / 303', '303 always means "GET this"', false, false);
  cell(400, 66, '307', 'retry the same POST there', true, false);
  cell(180, 156, '301', 'browsers turn POST into GET', false, true);
  cell(400, 156, '308', 'moved for good, keep POST', true, true);
  d.text(320, 296, '304 Not Modified is not a move: it says "your cached copy is still good"', { cls: 'xs' });
  return d.svg();
}

export function be_http_401_403() {
  const d = fig('be_http_401_403', '401: WE DO NOT KNOW WHO YOU ARE. 403: WE KNOW, AND THE ANSWER IS NO', 300);
  panel(d, 20, 40, 290, 230, '401 Unauthorized');
  d.person(110, 90, 50); d.text(110, 165, 'no badge', { cls: 'sm' });
  d.rect(200, 80, 60, 110, { r: 3, fill: C.card, stroke: C.ink2 });
  d.mono(165, 225, 'WWW-Authenticate: Bearer', { size: 9.5 });
  d.text(165, 250, 'log in, then try again', { cls: 'xs' });
  panel(d, 330, 40, 290, 230, '403 Forbidden', true);
  d.person(420, 90, 50, { fill: C.accSoft, stroke: C.acc }); d.text(420, 165, 'badge: user 42', { cls: 'sm' });
  d.rect(510, 80, 60, 110, { r: 3, fill: C.card, stroke: C.ink2 }); d.lock(530, 120, 20, { fill: C.accSoft, stroke: C.acc });
  d.text(475, 225, 'admin floor', { cls: 'sm' });
  d.text(475, 250, 'logging in again will not help', { cls: 'xs' });
  return d.svg();
}

export function be_http_4xx_tree() {
  const d = fig('be_http_4xx_tree', 'PICKING A 4XX: ASK THE QUESTIONS IN THE ORDER THE SERVER CHECKS THEM', 400);
  const q = [['body too big?', '413'], ['media type unsupported?', '415'], ['not parseable?', '400'], ['who are you?', '401'], ['allowed?', '403'], ['route has this method?', '405'], ['resource exists?', '404 / 410'], ['precondition holds?', '412'], ['fields valid?', '422'], ['conflicts with state?', '409'], ['over the limit?', '429']];
  d.line(320, 40, 320, 370, { stroke: C.ink2, sw: 1.4, single: true });
  q.forEach(([s, c], i) => { const y = 50 + i * 29, left = i % 2 === 0; d.dot(320, y, 3.5, C.ink); if (left) { d.text(306, y, s, { cls: 'sm', a: 'end' }); d.line(320, y, 400, y, { stroke: C.line, single: true }); d.circle(420, y, 34, { fill: ['409', '422'].includes(c) ? C.accSoft : C.card, stroke: ['409', '422'].includes(c) ? C.acc : C.ink2 }); d.mono(420, y, c.split(' ')[0], { size: 9 }); } else { d.text(334, y, s, { cls: 'sm', a: 'start' }); d.line(240, y, 320, y, { stroke: C.line, single: true }); d.circle(220, y, 34, { fill: ['409', '422'].includes(c) ? C.accSoft : C.card, stroke: ['409', '422'].includes(c) ? C.acc : C.ink2 }); d.mono(220, y, c.split(' ')[0], { size: 9 }); } });
  d.travel([[320, 40], [320, 370]], { token: (dd) => dd.dot(0, 0, 5, C.acc), dur: 8 });
  d.text(320, 388, 'illustrative order; real frameworks differ, but each code answers one question', { cls: 'xs' });
  return d.svg();
}

export function be_http_502_504() {
  const d = fig('be_http_502_504', 'THE PROXY ANSWERS FOR A BACKEND IT COULD NOT USE', 300);
  d.laptop(20, 110, 90, { label: 'client' });
  d.rect(190, 100, 110, 70, { r: 7, fill: C.card, stroke: C.ink2 }); d.text(245, 135, 'Nginx', { cls: 'ttl' });
  d.arrow(116, 135, 184, 135, { stroke: C.gray });
  d.server(470, 50, 70, 80, { label: 'app A' });
  d.server(470, 180, 70, 80, { label: 'app B', stroke: C.acc, fill: C.accSoft });
  d.arrow(304, 120, 460, 90, { stroke: C.ink2 }); d.text(380, 82, 'garbage or reset', { cls: 'xs' });
  d.arrow(304, 150, 460, 220, { stroke: C.acc }); d.clock(560, 220, 26, { spin: 3 });
  d.mono(245, 200, '502 Bad Gateway', { size: 10 }); d.mono(245, 220, '504 Gateway Timeout', { size: 10, color: C.acc });
  d.text(320, 285, '503: we are up but refusing (overload, maintenance); 500: our own code failed', { cls: 'xs' });
  return d.svg();
}

export function be_http_cache_control() {
  const d = fig('be_http_cache_control', 'Cache-Control: max-age=60 ON /menu. FRESH, THEN STALE, THEN REVALIDATED', 300);
  const X = (t) => 60 + t * 5.2;
  d.arrow(50, 170, 600, 170, { stroke: C.gray });
  d.rect(X(0), 120, X(60) - X(0), 40, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text((X(0) + X(60)) / 2, 140, 'fresh: served from cache', { cls: 'sm' });
  d.rect(X(60), 120, X(100) - X(60), 40, { r: 2, fill: C.card, stroke: C.ink2 }); d.text((X(60) + X(100)) / 2, 140, 'stale: revalidate', { cls: 'sm' });
  [0, 60, 100].forEach((t) => d.mono(X(t), 186, `${t} s`, { size: 9.5 }));
  d.doc(X(0) + 10, 60, 40, 50, { fill: C.paper }); d.clock(X(60), 80, 40, { t: 1 }); d.carrow([[X(100) - 10, 110], [X(100) + 20, 80], [X(100) + 40, 110]], { stroke: C.gray });
  d.text(320, 230, 'no-store: never keep it · no-cache: keep it but ask first · private: browser only', { cls: 'xs' });
  return d.svg();
}

export function be_http_etag() {
  const d = fig('be_http_etag', 'CONDITIONAL GET: SEND THE TAG YOU HAVE, GET 304 INSTEAD OF 2,000 BYTES', 280);
  const xs = actors(d, ['client cache', 'Wren API'], 44, 260, { x0: 150, x1: 490 });
  say(d, xs[0], xs[1], 100, 'GET /menu');
  say(d, xs[1], xs[0], 130, '200, ETag: "v7", 2,000 B');
  say(d, xs[0], xs[1], 180, 'GET /menu, If-None-Match: "v7"', { hot: true });
  say(d, xs[1], xs[0], 210, '304 Not Modified, 0 B body', { hot: true });
  d.text(320, 246, 'same validator, no body; Last-Modified + If-Modified-Since works the same way by date', { cls: 'xs' });
  return d.svg();
}

export function be_http_if_match() {
  const d = fig('be_http_if_match', 'If-Match STOPS A LOST UPDATE: THE SECOND WRITER GETS 412', 310);
  const xs = actors(d, ['editor A', 'Wren API', 'editor B'], 44, 290, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 96, 'GET -> ETag "v7"'); say(d, xs[2], xs[1], 96, 'GET -> ETag "v7"');
  say(d, xs[0], xs[1], 146, 'PUT If-Match: "v7"');
  d.mono(xs[1] + 10, 170, 'now "v8"', { a: 'start', size: 9.5 });
  say(d, xs[2], xs[1], 206, 'PUT If-Match: "v7"', { hot: true });
  say(d, xs[1], xs[2], 240, '412 Precondition Failed', { hot: true });
  d.text(320, 278, 'B re-reads v8 and merges instead of silently overwriting A', { cls: 'xs' });
  return d.svg();
}

export function be_http_vary() {
  const d = fig('be_http_vary', 'Vary TELLS A SHARED CACHE WHICH REQUEST HEADERS ARE PART OF THE KEY', 300);
  d.server(270, 70, 100, 140, { label: 'shared cache' });
  [['/menu + br', true], ['/menu + gzip', false], ['/menu + none', false]].forEach(([s, hot], i) => { d.rect(380, 80 + i * 40, 110, 28, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(435, 94 + i * 40, s, { size: 9, color: hot ? C.acc : undefined }); });
  [['br', 0], ['gzip', 1], ['none', 2]].forEach(([s, i]) => { d.phone(40, 60 + i * 70, 50); d.mono(110, 85 + i * 70, `Accept-Encoding: ${s}`, { size: 8.5, a: 'start', color: i === 0 ? C.acc : undefined }); d.arrow(220, 85 + i * 70, 266, 120 + i * 20, { stroke: i === 0 ? C.acc : C.gray, hl: 5 }); });
  d.text(560, 110, 'without Vary, a client', { cls: 'xs' }); d.text(560, 126, 'that cannot read br', { cls: 'xs' }); d.text(560, 142, 'may get br', { cls: 'xs', color: C.acc });
  d.text(320, 276, 'Vary: Origin does the same job for CORS responses', { cls: 'xs' });
  return d.svg();
}

export function be_http_keepalive() {
  const d = fig('be_http_keepalive', 'HTTP/1.0 PAYS A HANDSHAKE PER REQUEST; HTTP/1.1 KEEPS THE CONNECTION', 320);
  d.text(20, 56, 'HTTP/1.0: open, ask, close, repeat', { cls: 'ttl', a: 'start' });
  [0, 1, 2].forEach((k) => { const x = 40 + k * 190; d.rect(x, 76, 70, 26, { r: 13, fill: C.paper, stroke: C.line }); d.text(x + 35, 89, 'handshake', { cls: 'xs' }); packet(d, x + 110, 89, 'req'); d.line(x + 150, 76, x + 150, 102, { stroke: C.gray, sw: 2, single: true }); });
  d.text(20, 160, 'HTTP/1.1 keep-alive: one handshake, three requests', { cls: 'ttl', a: 'start', color: C.acc });
  d.rect(40, 180, 70, 26, { r: 13, fill: C.paper, stroke: C.line }); d.text(75, 193, 'handshake', { cls: 'xs' });
  pipe(d, 120, 600, 193, 22, true); [0, 1, 2].forEach((k) => d.travel([[130, 193], [590, 193]], { token: 'packet', at: [k * 0.3, k * 0.3 + 0.35] }));
  d.text(320, 270, 'with a 40 ms round trip, each skipped TCP + TLS 1.3 handshake saves 80 ms', { cls: 'xs' });
  return d.svg();
}

export function be_http_hol() {
  const d = fig('be_http_hol', 'HTTP/1.1: ONE RESPONSE AT A TIME PER CONNECTION, SO A SLOW ONE BLOCKS THE LINE', 310);
  for (let c = 1; c <= 6; c++) { const y = 50 + (c - 1) * 34; d.text(20, y, `conn ${c}`, { cls: 'xs', a: 'start' }); pipe(d, 70, 560, y, 20, c === 1); }
  d.rect(80, 41, 220, 18, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(190, 50, '/report: slow, 900 ms', { cls: 'xs', color: C.acc });
  [0, 1, 2].forEach((i) => d.envelope(310 + i * 34, 43, 28, 14, { fill: C.paper, stroke: C.gray }));
  for (let c = 2; c <= 6; c++) for (let k = 0; k < 5; k++) d.travel([[80, 50 + (c - 1) * 34], [550, 50 + (c - 1) * 34]], { token: (dd) => dd.envelope(-9, -6, 18, 12, { fill: C.card }), at: [k * 0.2, k * 0.2 + 0.3] });
  d.server(570, 40, 50, 190, {});
  d.text(320, 266, 'browsers open about six connections per host; 30 resources need 5 rounds', { cls: 'xs' });
  return d.svg();
}

export function be_http2_frames() {
  const d = fig('be_http2_frames', 'HTTP/2: STREAMS CUT INTO FRAMES AND INTERLEAVED ON ONE CONNECTION', 300);
  [['s1', 70], ['s3', 140], ['s5', 210]].forEach(([s, y], i) => { d.doc(30, y - 22, 36, 44, { fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.mono(48, y + 30, s, { size: 9 }); d.line(68, y, 150, 140, { stroke: C.line, single: true }); });
  pipe(d, 150, 610, 140, 40);
  const seq = [1, 3, 1, 5, 3, 3, 1, 5, 5, 3];
  seq.forEach((s, i) => d.travel([[160, 140], [600, 140]], { token: (dd) => { dd.rect(-16, -12, 32, 24, { r: 3, fill: s === 3 ? C.accSoft : s === 1 ? C.card : C.paper, stroke: s === 3 ? C.acc : C.ink2 }); dd.mono(0, 0, `s${s}`, { size: 9 }); }, at: [i * 0.08, i * 0.08 + 0.3] }));
  d.text(380, 104, 'one TCP + TLS connection', { cls: 'sm' });
  d.text(320, 230, 'each frame carries a stream id; the receiver reassembles stream 3 on its own', { cls: 'xs' });
  d.text(320, 252, 'client streams use odd ids: 1, 3, 5, …', { cls: 'xs' });
  return d.svg();
}

export function be_http2_hpack() {
  const d = fig('be_http2_hpack', 'HPACK: REPEATED HEADERS BECOME SMALL TABLE INDEXES', 320);
  letter(d, 20, 50, 260, [':method: GET', ':path: /orders/123', 'authorization: Bearer eyJ…', 'user-agent: WrenApp/5.2'], { hot: [2, 3] }); d.text(150, 160, 'first request: literal, then remembered', { cls: 'xs' });
  d.rect(330, 50, 280, 120, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(470, 66, 'table both sides keep', { cls: 'xs' });
  [['62', 'authorization: Bearer …', true], ['63', 'user-agent: WrenApp/5.2', true], ['2', ':method GET'], ['5', ':path /']].forEach(([n, s, hot], i) => { const y = 82 + i * 22; d.rect(340, y, 30, 18, { r: 2, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.line }); d.mono(355, y + 9, n, { size: 8.5 }); d.mono(380, y + 9, s, { size: 8.5, a: 'start' }); });
  d.envelope(60, 200, 200, 80, {}); ['2', '/orders/124', '62', '63'].forEach((s, i) => d.mono(80 + i * 46, 266, s, { size: 9, color: [2, 3].includes(i) ? C.acc : undefined }));
  d.text(160, 300, 'second request: mostly indexes', { cls: 'xs' });
  d.hand(470, 240, 'tokens sent once', { size: 16 });
  return d.svg();
}

export function be_http2_tcp_hol() {
  const d = fig('be_http2_tcp_hol', 'ONE LOST TCP PACKET STALLS EVERY HTTP/2 STREAM BEHIND IT', 290);
  pipe(d, 30, 610, 120, 44);
  const seq = [1, 3, 5, 1, 3, 5, 1, 3];
  seq.forEach((s, i) => { const lost = i === 2, x = 70 + i * 70; if (lost) { d.envelope(x - 22, 106, 44, 28, { fill: C.paper, stroke: C.acc, sw: 0.8 }); cross(d, x, 120, 10); } else packet(d, x, 120, '', { fill: i > 2 ? C.paper : C.card, stroke: i > 2 ? C.gray : C.ink2 }); d.mono(x, 160, `s${s}`, { size: 9 }); });
  d.brace(250, 600, 180, { label: 'held until the retransmit arrives, because TCP delivers in order' });
  d.text(320, 250, 'streams 1 and 3 wait for stream 5\'s lost packet', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_http3_quic() {
  const d = fig('be_http3_quic', 'HTTP/3 ON QUIC: LOSS ON STREAM 5 DELAYS ONLY STREAM 5', 300);
  [1, 3, 5].forEach((s, r) => { const y = 70 + r * 60; d.text(30, y, `stream ${s}`, { cls: 'sm', a: 'start' }); pipe(d, 100, 460, y, 30, s === 5);
    [0, 1, 2, 3].forEach((k) => { const lost = s === 5 && k === 1, x = 130 + k * 80; if (lost) { d.envelope(x - 18, y - 12, 36, 24, { fill: C.paper, stroke: C.acc }); cross(d, x, y, 8); } else d.travel([[110, y], [450, y]], { token: (dd) => dd.envelope(-14, -9, 28, 18, { fill: s === 5 ? C.accFaint : C.card, stroke: s === 5 ? C.acc : C.ink2 }), at: [k * 0.2, k * 0.2 + 0.4] }); });
    d.text(480, y, s === 5 ? 'waits for its retransmit' : 'delivered now', { cls: 'sm', a: 'start', color: s === 5 ? C.acc : undefined }); });
  d.text(320, 270, 'QUIC runs over UDP and orders bytes per stream, not per connection', { cls: 'xs' });
  return d.svg();
}

export function be_http3_migration() {
  const d = fig('be_http3_migration', 'CONNECTION MIGRATION: A QUIC CONNECTION ID SURVIVES A NEW IP ADDRESS', 280);
  d.phone(60, 70, 90); d.text(84, 180, 'wifi 192.0.2.7', { cls: 'xs' });
  d.server(500, 80, 90, 110, { label: 'Wren edge' });
  d.arrow(110, 100, 490, 110, { stroke: C.ink2 }); d.text(300, 90, 'conn id c9f2 from 192.0.2.7', { cls: 'mono', size: 9.5 });
  d.arrow(110, 150, 490, 160, { stroke: C.acc }); d.text(300, 175, 'conn id c9f2 from 198.51.100.4 (cellular)', { cls: 'mono', size: 9.5, color: C.acc });
  d.text(320, 240, 'TCP identifies a connection by addresses and ports, so the same switch kills it', { cls: 'xs' });
  return d.svg();
}

export function be_tls_why() {
  const d = fig('be_tls_why', 'ON THE SAME CAFE WIFI: PLAIN HTTP IS A POSTCARD, HTTPS IS A SEALED ENVELOPE', 290);
  panel(d, 20, 40, 290, 220, 'http://');
  d.doc(60, 80, 120, 80); d.mono(120, 110, 'password=', { size: 9 }); d.mono(120, 126, 'hunter2', { size: 9 });
  d.person(240, 90, 40); d.text(240, 150, 'reads and edits', { cls: 'xs' });
  panel(d, 330, 40, 290, 220, 'https://', true);
  d.envelope(370, 80, 120, 80, { fill: C.accSoft, stroke: C.acc }); d.lock(420, 104, 20, { fill: C.paper, stroke: C.acc });
  d.person(560, 90, 40); d.text(560, 150, 'sees only size\nand the server name', { cls: 'xs', vc: true });
  d.text(165, 220, 'no confidentiality, no integrity', { cls: 'xs' }); d.text(475, 220, 'confidential, tamper-evident, authenticated', { cls: 'xs' });
  return d.svg();
}

export function be_tls_history() {
  const d = fig('be_tls_history', 'SSL BECAME TLS; EVERYTHING BEFORE TLS 1.2 IS NOW RETIRED', 260);
  const ev = [['SSL 2.0', 1995], ['SSL 3.0', 1996], ['TLS 1.0', 1999], ['TLS 1.1', 2006], ['TLS 1.2', 2008], ['TLS 1.3', 2018]];
  const X = (y) => 40 + (y - 1994) * 23.5;
  d.arrow(30, 150, 620, 150, { stroke: C.gray });
  ev.forEach(([s, y], i) => { const ok = y >= 2008; d.lock(X(y) - 11, i % 2 ? 160 : 108, 22, { stroke: ok ? C.acc : C.gray, fill: ok ? C.accSoft : C.paper }); if (!ok) cross(d, X(y), i % 2 ? 175 : 122, 7, C.gray); d.text(X(y), i % 2 ? 206 : 90, s, { cls: 'ttl', size: 11, color: ok ? C.acc : undefined }); d.mono(X(y), i % 2 ? 222 : 74, String(y), { size: 9 }); });
  d.text(320, 246, 'TLS 1.0 and 1.1 were formally deprecated in 2021 (RFC 8996)', { cls: 'xs' });
  return d.svg();
}

export function be_tls_sym_asym() {
  const d = fig('be_tls_sym_asym', 'ASYMMETRIC CRYPTO AGREES ON A KEY; FAST SYMMETRIC CRYPTO MOVES THE DATA', 280);
  panel(d, 20, 40, 290, 210, 'symmetric (AES-GCM)', true);
  d.key(70, 110, 30, { fill: C.accSoft, stroke: C.acc }); d.key(230, 110, 30, { fill: C.accSoft, stroke: C.acc });
  d.text(165, 150, 'same key both ends', { cls: 'sm' }); d.text(165, 190, 'gigabytes per second;\nbut how do you share the key?', { cls: 'xs', vc: true });
  panel(d, 330, 40, 290, 210, 'asymmetric (ECDHE, signatures)');
  d.key(380, 110, 30); d.lock(530, 100, 26);
  d.text(475, 150, 'public key + private key', { cls: 'sm' }); d.text(475, 190, 'slow, used only in the\nhandshake', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tls_dh() {
  const d = fig('be_tls_dh', 'DIFFIE-HELLMAN WITH TOY NUMBERS: p = 23, g = 5. BOTH SIDES REACH 2', 300);
  const xs = actors(d, ['client (a = 6)', 'server (b = 15)'], 44, 280, { x0: 150, x1: 490 });
  say(d, xs[0], xs[1], 110, 'A = 5^6 mod 23 = 8');
  say(d, xs[1], xs[0], 150, 'B = 5^15 mod 23 = 19');
  d.mono(xs[0], 200, '19^6 mod 23 = 2', { size: 11, color: C.acc }); d.mono(xs[1], 200, '8^15 mod 23 = 2', { size: 11, color: C.acc });
  d.text(320, 245, 'an eavesdropper sees 8 and 19 but not 6 or 15; real TLS uses X25519 curves', { cls: 'xs' });
  return d.svg();
}

export function be_tls_forward_secrecy() {
  const d = fig('be_tls_forward_secrecy', 'FORWARD SECRECY: A STOLEN SERVER KEY CANNOT OPEN YESTERDAY\'S RECORDING', 290);
  panel(d, 20, 40, 290, 220, 'RSA key transport (TLS 1.2)');
  d.disk(110, 120, 70); d.text(110, 170, 'recorded traffic', { cls: 'xs' });
  d.key(200, 115, 32); d.arrow(190, 140, 140, 140, { stroke: C.ink2 }); d.text(165, 215, 'leaked key decrypts it all', { cls: 'sm' });
  panel(d, 330, 40, 290, 220, 'ephemeral ECDHE (TLS 1.3)', true);
  d.disk(420, 120, 70); d.key(510, 115, 32, { fill: C.accSoft, stroke: C.acc }); cross(d, 470, 140, 10);
  d.text(475, 215, 'session keys were never stored', { cls: 'sm', color: C.acc });
  return d.svg();
}

export function be_tls13_handshake() {
  const d = fig('be_tls13_handshake', 'TLS 1.3 FULL HANDSHAKE: ONE ROUND TRIP, THEN ENCRYPTED HTTP', 340);
  const xs = actors(d, ['client', 'api.wren.example'], 44, 320, { x0: 150, x1: 490 });
  say(d, xs[0], xs[1], 96, 'ClientHello: versions, ciphers, key share, SNI, ALPN');
  say(d, xs[1], xs[0], 140, 'ServerHello: chosen cipher, key share', { hot: true });
  d.rect(xs[0] + 20, 156, xs[1] - xs[0] - 40, 72, { r: 5, fill: C.accFaint, stroke: C.acc, dash: [4, 3] });
  d.text(320, 174, 'encrypted from here on', { cls: 'xs', color: C.acc });
  say(d, xs[1], xs[0], 196, '{Certificate, CertificateVerify, Finished}');
  say(d, xs[0], xs[1], 252, '{Finished} + GET /orders/123');
  say(d, xs[1], xs[0], 292, '{200 OK}');
  return d.svg();
}

export function be_tls_cipher_suite() {
  const d = fig('be_tls_cipher_suite', 'READING A CIPHER SUITE NAME', 300);
  d.text(60, 66, 'TLS 1.3 suite', { cls: 'ttl', a: 'start' });
  [['TLS', 'protocol', 'doc'], ['AES_128_GCM', 'record cipher (AEAD)', 'lock'], ['SHA256', 'handshake hash', 'gear']].forEach(([s, l, k], i) => { const x = 110 + i * 180; if (k === 'lock') d.lock(x - 14, 80, 28, { stroke: C.acc, fill: C.accSoft }); else if (k === 'gear') d.gear(x, 96, 16, {}); else d.doc(x - 12, 80, 24, 30, {}); d.mono(x, 128, s, { size: 11, color: i === 1 ? C.acc : undefined }); d.text(x, 146, l, { cls: 'xs' }); });
  d.text(60, 186, 'TLS 1.2 suite', { cls: 'ttl', a: 'start' });
  [['ECDHE', 'key exchange'], ['RSA', 'signature'], ['AES_256_GCM', 'cipher'], ['SHA384', 'hash']].forEach(([s, l], i) => { const x = 100 + i * 140; d.mono(x, 220, s, { size: 10.5 }); d.text(x, 240, l, { cls: 'xs' }); if (i < 3) d.text(x + 70, 220, '_', { cls: 'mono', size: 11 }); });
  d.text(320, 280, 'TLS 1.3 moved key exchange and signature out of the name; they are negotiated separately', { cls: 'xs' });
  return d.svg();
}

export function be_tls_rtt() {
  const d = fig('be_tls_rtt', 'ROUND TRIPS BEFORE THE FIRST RESPONSE BYTE, AT 40 MS RTT AND 30 MS SERVER TIME', 320);
  const R = [['TCP + TLS 1.2', 215, 3], ['TCP + TLS 1.3', 175, 2], ['QUIC (HTTP/3)', 135, 1], ['QUIC 0-RTT resume', 95, 0], ['reused connection', 70, 0]];
  R.forEach(([s, ms, rt], i) => { const y = 60 + i * 46, hot = i === 1; d.text(160, y, s, { cls: 'sm', a: 'end', color: hot ? C.acc : undefined }); for (let k = 0; k < rt; k++) d.carrow([[176 + k * 34, y + 6], [193 + k * 34, y - 14], [210 + k * 34, y + 6]], { stroke: hot ? C.acc : C.gray }); d.rect(176 + rt * 34, y - 8, ms * 1.3, 16, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(184 + rt * 34 + ms * 1.3, y, `${ms} ms`, { size: 9.5, a: 'start' }); });
  d.text(320, 296, 'arcs are round trips before the request; each total includes 25 ms of DNS except the reused one', { cls: 'xs' });
  return d.svg();
}

export function be_tls_resumption() {
  const d = fig('be_tls_resumption', 'RESUMPTION WITH A TICKET; 0-RTT DATA CAN BE REPLAYED', 300);
  const xs = actors(d, ['client', 'server'], 44, 280, { x0: 150, x1: 490 });
  say(d, xs[1], xs[0], 92, 'NewSessionTicket (after first handshake)');
  say(d, xs[0], xs[1], 150, 'ClientHello + ticket + early data: GET /menu', { hot: true });
  say(d, xs[1], xs[0], 190, 'ServerHello ... 200 OK');
  d.person(560, 220, 34); cross(d, 560, 236, 12);
  d.text(400, 250, 'an attacker can resend the early data', { cls: 'xs' });
  d.text(320, 272, 'allow 0-RTT only for safe, idempotent requests', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_tls_sni() {
  const d = fig('be_tls_sni', 'SNI PICKS THE CERTIFICATE; ALPN PICKS THE PROTOCOL, BOTH IN ClientHello', 280);
  card(d, 20, 60, 250, ['ClientHello', 'server_name: api.wren.example', 'alpn: h2, http/1.1'], { hot: [1, 2] });
  d.server(330, 70, 80, 120, { label: 'one IP' });
  d.doc(470, 50, 60, 70, { fill: C.accSoft, stroke: C.acc }); d.text(500, 135, 'api cert', { cls: 'xs', color: C.acc });
  d.doc(550, 50, 60, 70); d.text(580, 135, 'www cert', { cls: 'xs' });
  d.arrow(414, 110, 466, 90, { stroke: C.acc });
  d.mono(520, 180, 'alpn chosen: h2', { size: 10, color: C.acc });
  d.text(320, 250, 'SNI is visible on the wire unless Encrypted Client Hello is used', { cls: 'xs' });
  return d.svg();
}

export function be_cert_chain() {
  const d = fig('be_cert_chain', 'THE CHAIN: EACH CERTIFICATE IS SIGNED BY THE ONE ABOVE IT', 340);
  [['root CA', 'in the OS trust store', 50, false], ['intermediate CA', 'sent by the server', 140, false], ['api.wren.example', 'leaf, 90 days', 230, true]].forEach(([s, t, y, hot]) => {
    d.doc(230, y, 180, 64, { lines: false, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(320, y + 24, s, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(320, y + 44, t, { cls: 'xs' });
  });
  d.arrow(320, 118, 320, 136, { stroke: C.ink2 }); d.arrow(320, 208, 320, 226, { stroke: C.ink2 });
  d.text(470, 128, 'signs', { cls: 'sm', a: 'start' }); d.text(470, 218, 'signs', { cls: 'sm', a: 'start' });
  shield(d, 110, 60, 60, { fill: C.card, label: 'trust' });
  d.text(110, 150, 'root key stays\noffline', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cert_validate() {
  const d = fig('be_cert_validate', 'WHAT THE CLIENT CHECKS BEFORE IT SENDS A SINGLE HEADER', 330);
  cert(d, 470, 40, 120, 70, { label: 'root CA' }); cert(d, 470, 130, 120, 70, { label: 'intermediate' }); cert(d, 470, 220, 120, 70, { label: 'api.wren…', stroke: C.acc });
  d.arrow(530, 128, 530, 114, { stroke: C.gray, hl: 4 }); d.arrow(530, 218, 530, 204, { stroke: C.gray, hl: 4 });
  const c = ['chain ends at a trusted root', 'every signature verifies', 'now is between notBefore and notAfter', 'SAN lists api.wren.example', 'not revoked (OCSP or CRL)', 'server proves the key (CertificateVerify)'];
  c.forEach((s, i) => { const y = 60 + i * 40; d.rect(30, y - 13, 26, 26, { r: 4, fill: C.accSoft, stroke: C.acc }); tick(d, 43, y, 6); d.text(70, y, s, { cls: 'sm', a: 'start' }); });
  d.hand(320, 310, 'any no: the connection fails', { size: 15 });
  return d.svg();
}

export function be_cert_expiry() {
  const d = fig('be_cert_expiry', 'A 90-DAY CERTIFICATE RENEWED AT DAY 60 LEAVES 30 DAYS TO NOTICE FAILURE', 280);
  const X = (t) => 50 + t * 5.8;
  d.arrow(40, 160, 610, 160, { stroke: C.gray });
  d.rect(X(0), 130, X(60) - X(0), 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text((X(0) + X(60)) / 2, 145, 'valid', { cls: 'sm' });
  d.rect(X(60), 130, X(90) - X(60), 30, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text((X(60) + X(90)) / 2, 145, 'renewal window', { cls: 'sm' });
  [0, 60, 90].forEach((t) => d.mono(X(t), 178, `day ${t}`, { size: 9.5 }));
  cert(d, X(0), 54, 70, 50, {}); cert(d, X(60) - 35, 54, 70, 50, { stroke: C.acc }); d.carrow([[X(60) - 50, 80], [X(60) - 42, 62], [X(60) - 36, 78]], { stroke: C.acc });
  d.text(320, 230, 'alert when any certificate in production has fewer than 14 days left', { cls: 'xs' });
  return d.svg();
}

export function be_cert_ocsp() {
  const d = fig('be_cert_ocsp', 'OCSP STAPLING: THE SERVER FETCHES THE PROOF SO EVERY CLIENT DOES NOT HAVE TO', 300);
  panel(d, 20, 40, 290, 230, 'plain OCSP');
  d.laptop(40, 90, 80); d.server(210, 80, 60, 70, { label: 'CA responder' });
  d.arrow(124, 110, 204, 110, { stroke: C.ink2 }); d.text(165, 100, 'is it revoked?', { cls: 'xs' });
  d.text(165, 220, 'extra round trip, leaks\nwhich sites you visit', { cls: 'xs', vc: true });
  panel(d, 330, 40, 290, 230, 'stapled', true);
  d.server(530, 80, 60, 70, { label: 'Wren' }); d.laptop(360, 90, 80);
  d.arrow(524, 120, 444, 120, { stroke: C.acc }); d.doc(470, 160, 40, 46, { fill: C.accSoft, stroke: C.acc });
  d.text(475, 230, 'signed "good" status rides in\nthe handshake', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tls_hsts() {
  const d = fig('be_tls_hsts', 'HSTS: AFTER ONE HTTPS VISIT, THE BROWSER REFUSES TO TRY HTTP', 280);
  card(d, 20, 50, 330, ['HTTP/1.1 200 OK', 'Strict-Transport-Security:', '  max-age=31536000; includeSubDomains'], { hot: [1, 2] });
  browser(d, 380, 50, 240, 120, 'http://api.wren.example');
  d.arrow(500, 120, 500, 200, { stroke: C.acc });
  d.mono(500, 214, 'rewritten to https:// locally', { size: 9.5, color: C.acc });
  d.text(185, 160, 'first visit is still exposed;\nthe preload list closes that gap', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tls_termination() {
  const d = fig('be_tls_termination', 'TLS TERMINATION: DECRYPT AT THE EDGE, THEN PLAIN OR RE-ENCRYPTED INSIDE', 300);
  d.laptop(20, 110, 90, { label: 'client' });
  d.rect(200, 100, 110, 80, { r: 7, fill: C.accSoft, stroke: C.acc }); d.text(255, 130, 'load balancer', { cls: 'ttl', size: 11 }); d.text(255, 152, 'holds the cert', { cls: 'xs' });
  d.flowline([[116, 140], [194, 140]], { color: C.acc }); d.lock(145, 112, 16, { fill: C.accSoft, stroke: C.acc });
  [70, 160, 250].forEach((y, i) => { d.server(500, y - 30, 70, 60); d.arrow(314, 140, 494, y, { stroke: i === 2 ? C.acc : C.ink2, hl: 5 }); });
  d.text(400, 72, 'plain HTTP in a private network', { cls: 'xs' });
  d.text(420, 290, 'or mTLS when the network is not trusted', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_dns_records() {
  const d = fig('be_dns_records', 'THE WREN ZONE: EACH RECORD TYPE ANSWERS A DIFFERENT QUESTION', 340);
  d.rect(20, 44, 380, 270, { r: 4, fill: C.paper, stroke: C.ink2 }); for (let i = 0; i < 9; i++) d.line(20, 74 + i * 30, 400, 74 + i * 30, { stroke: C.line, single: true, sw: 0.6 });
  ['wren.example. zone', 'api     300  A      203.0.113.10', 'api     300  AAAA   2001:db8::10', 'www     300  CNAME  wren.cdn.example.', '@       3600 MX     10 mail.wren.example.', '@       3600 TXT    "v=spf1 include:…"', '@     86400  NS     ns1.dns.example.', '_grpc._tcp.orders  SRV  0 5 8443 orders…'].forEach((s, i) => d.mono(30, 60 + i * 30, s, { a: 'start', size: 9, color: i === 1 ? C.acc : undefined, w: i === 0 ? 600 : undefined }));
  const ic = [(x, y) => d.server(x, y - 10, 18, 20, { unit: 6 }), (x, y) => d.server(x, y - 10, 18, 20, { unit: 6 }), (x, y) => d.carrow([[x, y], [x + 10, y - 8], [x + 18, y]], { stroke: C.ink2 }), (x, y) => d.envelope(x, y - 7, 20, 14, {}), (x, y) => d.doc(x + 3, y - 10, 14, 20, {}), (x, y) => d.person(x + 9, y - 10, 18), (x, y) => d.pin(x + 9, y + 8, {})];
  [['A', 'IPv4 address'], ['AAAA', 'IPv6 address'], ['CNAME', 'alias to another name'], ['MX', 'where mail goes'], ['TXT', 'free text: SPF, verification'], ['NS', 'who is authoritative'], ['SRV', 'host and port of a service']].forEach(([t, s], i) => { const y = 90 + i * 30; ic[i](420, y); d.mono(450, y, t, { a: 'start', size: 10, color: i === 0 ? C.acc : undefined }); d.text(500, y, s, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_dns_resolution() {
  const d = fig('be_dns_resolution', 'A COLD LOOKUP OF api.wren.example WALKS DOWN THE TREE ONCE, THEN CACHES', 330);
  d.laptop(20, 130, 80, { label: 'stub resolver' });
  d.rect(170, 120, 120, 70, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(230, 147, 'recursive', { cls: 'ttl', color: C.acc }); d.text(230, 167, 'resolver + cache', { cls: 'xs' });
  d.arrow(104, 155, 164, 155, { stroke: C.acc });
  [['root (.)', 'ask .example servers', 50], ['.example TLD', 'ask ns1.dns.example', 140], ['authoritative', 'A 203.0.113.10, TTL 300', 230]].forEach(([s, t, y], i) => {
    d.server(430, y, 60, 60); d.text(500, y + 20, s, { cls: 'ttl', size: 11, a: 'start' }); d.text(500, y + 40, t, { cls: 'xs', a: 'start' });
    d.arrow(294, 150, 424, y + 30, { stroke: i === 2 ? C.acc : C.gray, hl: 5 });
    d.mono(360, y + 20 + (i === 0 ? 30 : i === 1 ? 0 : -30), String(i + 1), { size: 10 });
  });
  return d.svg();
}

export function be_dns_ttl() {
  const d = fig('be_dns_ttl', 'EVERY CACHE ON THE PATH COUNTS THE TTL DOWN ON ITS OWN CLOCK', 290);
  [['browser', 300, 120, 'b'], ['OS', 300, 200, 'l'], ['recursive', 300, 41, 's']].forEach(([s, tot, left, k], i) => { const y = 60 + i * 60;
    if (k === 'b') browser(d, 30, y - 6, 60, 36, ''); if (k === 'l') d.laptop(34, y - 6, 54); if (k === 's') d.server(44, y - 8, 30, 40, {});
    d.text(130, y + 12, s, { cls: 'sm', a: 'end' }); hourglass(d, 160, y - 4, 32, { level: 1 - left / tot, stroke: i === 2 ? C.acc : C.ink2 });
    d.rect(190, y, 340, 24, { r: 3, fill: C.paper, stroke: C.line }); d.rect(190, y, 340 * left / tot, 24, { r: 3, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.mono(540, y + 12, `${left} s left`, { a: 'start', size: 10 }); });
  d.text(320, 256, 'negative answers (NXDOMAIN) are cached too, for the SOA minimum TTL', { cls: 'xs' });
  return d.svg();
}

export function be_dns_routing() {
  const d = fig('be_dns_routing', 'THE AUTHORITATIVE SERVER CAN ANSWER DIFFERENTLY PER ASKER', 320);
  panel(d, 20, 40, 190, 240, 'weighted');
  d.circle(115, 130, 90, { fill: C.card, stroke: C.ink2 }); d.path('M115,130 L115,85 A45,45 0 0 1 141.5,93.6 Z', { fill: C.accSoft, stroke: C.acc, single: true });
  d.mono(115, 200, '90% → v1 pool', { size: 9 }); d.mono(115, 218, '10% → v2 pool', { size: 9, color: C.acc });
  panel(d, 225, 40, 190, 240, 'geographic', true);
  d.pin(280, 130, { label: 'India', dy: 14 }); d.pin(360, 110, { label: 'EU', dy: 14 }); d.mono(320, 200, 'India → .20', { size: 9 }); d.mono(320, 218, 'EU → .30', { size: 9 });
  panel(d, 430, 40, 190, 240, 'failover');
  d.server(460, 90, 50, 70, {}); cross(d, 485, 125, 10); d.server(540, 90, 50, 70, { stroke: C.acc, led: () => true }); d.mono(525, 200, 'primary down?', { size: 9 }); d.mono(525, 218, '→ standby IP', { size: 9 });
  d.text(320, 302, 'all three still obey TTLs: changes reach clients only as caches expire', { cls: 'xs' });
  return d.svg();
}

export function be_dns_stale() {
  const d = fig('be_dns_stale', 'MIGRATING api.wren.example: LOWER THE TTL FIRST, THEN MOVE, THEN KEEP THE OLD SERVER UP', 320);
  const X = (t) => 50 + t * 52;
  d.arrow(40, 170, 620, 170, { stroke: C.gray });
  [['TTL 300 → 60', 0], ['wait > 300 s', 2], ['change A record', 4], ['old IP still hit', 6], ['decommission', 10]].forEach(([s, t], i) => { d.dot(X(t), 170, 4, i === 2 ? C.acc : C.ink); d.text(X(t), i % 2 ? 205 : 140, s, { cls: 'sm', color: i === 2 ? C.acc : undefined }); });
  hourglass(d, X(2), 60, 50, { level: 0.5 }); d.server(X(4) - 20, 50, 40, 60, { stroke: C.acc, led: () => true }); d.server(X(7) - 20, 50, 40, 60, {}); d.blink((dd) => dd.dot(X(7) + 10, 60, 3.5, C.acc)); cross(d, X(10), 80, 10, C.ink2);
  d.rect(X(4), 180, X(10) - X(4), 10, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.text(320, 270, 'some resolvers and long-lived clients ignore TTLs: watch traffic on the old IP before turning it off', { cls: 'xs' });
  return d.svg();
}

export function be_e2e_request() {
  const d = fig('be_e2e_request', 'GET https://api.wren.example/orders/123, FROM TYPING TO JSON', 340);
  d.laptop(20, 120, 90);
  const H = [['DNS', 'A 203.0.113.10', 160, 80], ['TCP', 'SYN, SYN-ACK, ACK', 240, 200], ['TLS 1.3', 'keys + cert check', 320, 80], ['HTTP/2', 'HEADERS frame', 400, 200], ['load balancer', 'terminates TLS', 480, 80]];
  H.forEach(([a, b, x, y], i) => { d.circle(x, y, 60, { fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(x, y - 4, a, { cls: 'xs', color: i === 2 ? C.acc : undefined }); d.text(x, y + 44, b, { cls: 'xs' }); });
  d.server(540, 120, 60, 90, { label: 'Wren app' }); d.db(560, 240, 50, 50, {}); d.text(530, 310, 'PostgreSQL: order 123', { cls: 'xs' });
  const P = [[110, 150], [160, 80], [240, 200], [320, 80], [400, 200], [480, 80], [540, 160], [585, 240]];
  d.curve(P, { stroke: C.line, sw: 1.5, single: true }); d.travel(P, { token: 'packet' });
  d.text(240, 310, 'the response, 200 and 2,000 B, retraces the path', { cls: 'xs' });
  return d.svg();
}

export function be_e2e_layers() {
  const d = fig('be_e2e_layers', 'WHAT EACH LAYER CONTRIBUTES TO ONE REQUEST', 320);
  const c = [['DNS', 'name to address, with a TTL'], ['TCP or QUIC', 'reliable, ordered delivery'], ['TLS', 'secrecy, integrity, identity'], ['certificates', 'why we believe the identity'], ['HTTP', 'method, target, status, headers'], ['caching headers', 'when not to ask at all']];
  const ic = [(x, y) => d.pin(x + 14, y + 30, {}), (x, y) => pipe(d, x, x + 30, y + 16, 12), (x, y) => d.lock(x + 4, y, 24, { stroke: C.acc }), (x, y) => cert(d, x, y + 2, 30, 24, {}), (x, y) => d.envelope(x, y + 6, 30, 20, {}), (x, y) => d.clock(x + 15, y + 15, 28, { t: 0.2 })];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 86; d.rect(x, y, 290, 68, { r: 7, fill: i === 2 ? C.accFaint : C.card, stroke: i === 2 ? C.acc : C.line }); ic[i](x + 14, y + 18); d.text(x + 62, y + 24, t, { cls: 'ttl', a: 'start' }); d.text(x + 62, y + 46, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

export function be_e2e_waterfall() {
  const d = fig('be_e2e_waterfall', 'COLD START WATERFALL FOR GET /orders/123 OVER TCP + TLS 1.3: 175 MS', 320);
  const X = (t) => 130 + t * 2.6;
  const rows = [['DNS lookup', 0, 25], ['TCP handshake', 25, 65], ['TLS 1.3', 65, 105], ['request out', 105, 125], ['server work', 125, 155], ['response back', 155, 175]];
  rows.forEach(([s, a, b], i) => { const y = 50 + i * 34; d.text(120, y + 11, s, { cls: 'sm', a: 'end' }); d.rect(X(a), y, X(b) - X(a), 22, { r: 3, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 }); d.mono(X(b) + 6, y + 11, `${b} ms`, { a: 'start', size: 9 }); });
  d.server(X(125) + 10, 196, 30, 40, { stroke: C.acc }); d.clock(560, 120, 60, { spin: 3 });
  d.line(X(0), 270, X(175), 270, { stroke: C.gray, single: true });
  d.text(320, 296, 'only the orange 30 ms is Wren code; the other 145 ms is distance', { cls: 'xs' });
  return d.svg();
}

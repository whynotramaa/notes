import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser } from '../lib/be-kit.js';

const PARTS = ['HTTP messages', 'HTTP methods and idempotency', 'HTTP status codes', 'HTTP caching headers', 'HTTP/1.1, HTTP/2 and HTTP/3', 'TLS and the handshake', 'Certificates and trust', 'DNS for backend engineers', 'The HTTPS request end to end'];
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
  const d = fig('be_http_wire', 'WHAT ACTUALLY CROSSES THE WIRE IN HTTP/1.1: LINES OF TEXT', 300);
  card(d, 20, 50, 290, ['GET /orders/123 HTTP/1.1', 'Host: api.wren.example', 'Accept: application/json', 'Authorization: Bearer eyJ...', '', '(no body)'], { title: 'request', hot: [0] });
  card(d, 330, 50, 290, ['HTTP/1.1 200 OK', 'Content-Type: application/json', 'Content-Length: 2000', 'Cache-Control: private, max-age=0', '', '{"id":123,"status":"paid",...}'], { title: 'response', hot: [0] });
  d.text(165, 200, 'blank line ends the headers', { cls: 'xs' });
  d.hand(320, 250, 'start line, headers, blank line, body');
  return d.svg();
}

export function be_http_anatomy() {
  const d = fig('be_http_anatomy', 'THE START LINE NAMES THE ACTION; THE STATUS LINE NAMES THE OUTCOME', 290);
  d.chips(40, 60, ['POST', '/orders?src=app', 'HTTP/1.1'], { h: 30, size: 12, fill: (i) => (i === 0 ? C.accSoft : C.card), stroke: (i) => (i === 0 ? C.acc : C.ink2) });
  d.text(64, 112, 'method', { cls: 'sm' }); d.text(178, 112, 'request target', { cls: 'sm' }); d.text(316, 112, 'version', { cls: 'sm' });
  d.chips(40, 160, ['HTTP/1.1', '201', 'Created'], { h: 30, size: 12, fill: (i) => (i === 1 ? C.accSoft : C.card), stroke: (i) => (i === 1 ? C.acc : C.ink2) });
  d.text(76, 212, 'version', { cls: 'sm' }); d.text(150, 212, 'status code', { cls: 'sm' }); d.text(222, 212, 'reason phrase', { cls: 'sm' });
  d.text(480, 80, 'request line', { cls: 'ttl' }); d.text(480, 180, 'status line', { cls: 'ttl' });
  d.text(320, 258, 'clients branch on the number; the phrase is for humans and HTTP/2 drops it', { cls: 'xs' });
  return d.svg();
}

export function be_http_framing() {
  const d = fig('be_http_framing', 'TWO WAYS TO SAY WHERE THE BODY ENDS', 300);
  panel(d, 20, 40, 290, 230, 'Content-Length: 2000');
  d.rect(50, 90, 230, 40, { r: 3, fill: C.card, stroke: C.ink2 });
  d.mono(165, 110, '2,000 bytes, then done', { size: 10 });
  d.brace(50, 280, 145, { label: 'reader counts exactly 2,000 bytes' });
  d.text(165, 220, 'size must be known before sending', { cls: 'xs' });
  panel(d, 330, 40, 290, 230, 'Transfer-Encoding: chunked', true);
  [['7d0', 60], ['400', 40], ['0', 10]].forEach(([h, w], i) => {
    const y = 80 + i * 44;
    d.chips(350, y, [h], { h: 26, fill: C.accSoft, stroke: C.acc });
    d.rect(400, y, w * 3, 26, { r: 3, fill: i === 2 ? C.paper : C.card, stroke: C.ink2 });
  });
  d.text(475, 230, 'hex size, data, ... a zero-size chunk ends it', { cls: 'xs' });
  return d.svg();
}

export function be_http_encoding() {
  const d = fig('be_http_encoding', 'CONTENT NEGOTIATION: THE CLIENT OFFERS, THE SERVER PICKS AND LABELS', 260);
  card(d, 20, 50, 260, ['GET /menu HTTP/1.1', 'Accept: application/json', 'Accept-Encoding: gzip, br'], { title: 'client offers', hot: [2] });
  d.arrow(290, 90, 350, 90, { stroke: C.gray });
  card(d, 360, 50, 260, ['HTTP/1.1 200 OK', 'Content-Type: application/json', 'Content-Encoding: br', 'Vary: Accept-Encoding'], { title: 'server labels its choice', hot: [2, 3] });
  d.text(320, 200, 'Content-Type is what the bytes mean; Content-Encoding is how they were squeezed', { cls: 'xs' });
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
  const ms = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'PATCH', 'POST'];
  const safe = [1, 1, 1, 0, 0, 0, 0], idem = [1, 1, 1, 1, 1, 0, 0];
  d.text(230, 56, 'safe', { cls: 'ttl' }); d.text(330, 56, 'idempotent', { cls: 'ttl' });
  ms.forEach((m, i) => {
    const y = 74 + i * 34;
    d.mono(120, y + 13, m, { size: 11, a: 'end' });
    [safe[i], idem[i]].forEach((v, j) => {
      const x = 190 + j * 100;
      d.rect(x, y, 80, 26, { r: 4, fill: v ? C.accSoft : C.paper, stroke: v ? C.acc : C.line });
      if (v) tick(d, x + 40, y + 13, 7); else d.text(x + 40, y + 13, 'no', { cls: 'xs' });
    });
  });
  d.text(510, 140, 'PATCH can be\nidempotent if the\npatch sets values', { cls: 'xs', vc: true });
  d.text(510, 260, 'POST is neither\nunless you add a key', { cls: 'xs', vc: true });
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
  const d = fig('be_http_2xx', 'FIVE WAYS TO SUCCEED, EACH TELLING THE CLIENT SOMETHING DIFFERENT', 260);
  const c = [['200', 'OK', 'here is the\nresult'], ['201', 'Created', 'new resource,\nsee Location'], ['202', 'Accepted', 'queued, not\ndone yet'], ['204', 'No Content', 'done, no\nbody'], ['206', 'Partial', 'the byte range\nyou asked for']];
  c.forEach(([n, s, t], i) => {
    const x = 20 + i * 122;
    d.rect(x, 60, 110, 150, { r: 8, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 });
    d.text(x + 55, 92, n, { cls: 'mono', size: 22, color: i === 2 ? C.acc : undefined });
    d.text(x + 55, 122, s, { cls: 'ttl', size: 11 });
    d.text(x + 55, 165, t, { cls: 'xs', vc: true });
  });
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
  const d = fig('be_http_redirects', 'REDIRECTS DIFFER ON TWO QUESTIONS: PERMANENT? AND MAY THE METHOD CHANGE?', 290);
  d.text(260, 56, 'method may become GET', { cls: 'ttl' }); d.text(480, 56, 'method and body kept', { cls: 'ttl' });
  d.text(90, 100, 'temporary', { cls: 'ttl', a: 'end' }); d.text(90, 180, 'permanent', { cls: 'ttl', a: 'end' });
  const cell = (x, y, code, note, hot) => { d.rect(x, y, 180, 60, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 90, y + 22, code, { cls: 'mono', size: 14, color: hot ? C.acc : undefined }); d.text(x + 90, y + 44, note, { cls: 'xs' }); };
  cell(170, 72, '302 / 303', '303 always means "GET this"', false);
  cell(390, 72, '307', 'retry same POST there', true);
  cell(170, 152, '301', 'browsers turn POST into GET', false);
  cell(390, 152, '308', 'moved for good, keep POST', true);
  d.text(320, 250, '304 Not Modified is not a move: it says "your cached copy is still good"', { cls: 'xs' });
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
  q.forEach(([s, c], i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 30 + col * 300, y = 50 + row * 56;
    d.rect(x, y, 190, 34, { r: 6, fill: C.card, stroke: C.ink2 });
    d.text(x + 95, y + 17, s, { cls: 'sm' });
    d.arrow(x + 194, y + 17, x + 222, y + 17, { stroke: C.gray, hl: 5 });
    d.mono(x + 228, y + 17, c, { a: 'start', size: 12, color: ['409', '422'].includes(c) ? C.acc : undefined });
  });
  d.text(320, 384, 'illustrative order; real frameworks differ, but each code answers one question', { cls: 'xs' });
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
  const d = fig('be_http_cache_control', 'Cache-Control: max-age=60 ON /menu. FRESH, THEN STALE, THEN REVALIDATED', 270);
  const X = (t) => 60 + t * 5.2;
  d.arrow(50, 150, 600, 150, { stroke: C.gray });
  d.fillRect(X(0), 110, X(60) - X(0), 30, C.accSoft);
  d.rect(X(0), 110, X(60) - X(0), 30, { r: 2, stroke: C.acc });
  d.text((X(0) + X(60)) / 2, 125, 'fresh: served from cache', { cls: 'sm' });
  d.rect(X(60), 110, X(100) - X(60), 30, { r: 2, fill: C.card, stroke: C.ink2 });
  d.text((X(60) + X(100)) / 2, 125, 'stale: must revalidate', { cls: 'sm' });
  [0, 60, 100].forEach((t) => d.mono(X(t), 170, `${t} s`, { size: 9.5 }));
  d.text(320, 215, 'no-store: never keep it. no-cache: keep it but ask first. private: browser only', { cls: 'xs' });
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
  const d = fig('be_http_vary', 'Vary TELLS A SHARED CACHE WHICH REQUEST HEADERS ARE PART OF THE KEY', 280);
  d.rect(250, 80, 140, 120, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(320, 100, 'shared cache', { cls: 'ttl' });
  d.mono(320, 135, '/menu + br', { size: 10, color: C.acc }); d.mono(320, 160, '/menu + gzip', { size: 10 }); d.mono(320, 185, '/menu + none', { size: 10 });
  [['Accept-Encoding: br', 90, true], ['Accept-Encoding: gzip', 150, false], ['(no encoding)', 210, false]].forEach(([s, y, hot]) => { d.mono(20, y, s, { a: 'start', size: 9.5, color: hot ? C.acc : undefined }); d.arrow(170, y, 244, y - 30 + (y - 90) / 2.4, { stroke: hot ? C.acc : C.gray, hl: 5 }); });
  d.text(520, 120, 'without Vary, a\nclient that cannot\nread br may get br', { cls: 'xs', vc: true });
  d.text(320, 250, 'Vary: Origin does the same job for CORS responses', { cls: 'xs' });
  return d.svg();
}

export function be_http_keepalive() {
  const d = fig('be_http_keepalive', 'HTTP/1.0 PAYS A HANDSHAKE PER REQUEST; HTTP/1.1 KEEPS THE CONNECTION', 300);
  const row = (y, title, segs, hot) => {
    d.text(20, y - 14, title, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined });
    let x = 20;
    segs.forEach(([k, w]) => { d.rect(x, y, w, 26, { r: 3, fill: k === 'req' ? (hot ? C.accSoft : C.card) : C.paper, stroke: k === 'req' ? (hot ? C.acc : C.ink2) : C.line }); d.text(x + w / 2, y + 13, k === 'req' ? 'req' : 'hs', { cls: 'xs' }); x += w + 4; });
  };
  row(70, 'HTTP/1.0: open, ask, close, repeat', [['hs', 80], ['req', 70], ['hs', 80], ['req', 70], ['hs', 80], ['req', 70]]);
  row(170, 'HTTP/1.1 keep-alive: one handshake, three requests', [['hs', 80], ['req', 70], ['req', 70], ['req', 70]], true);
  d.text(320, 250, 'with a 40 ms round trip, each skipped TCP + TLS 1.3 handshake saves 80 ms', { cls: 'xs' });
  return d.svg();
}

export function be_http_hol() {
  const d = fig('be_http_hol', 'HTTP/1.1: ONE RESPONSE AT A TIME PER CONNECTION, SO A SLOW ONE BLOCKS THE LINE', 300);
  d.text(20, 50, 'connection 1', { cls: 'sm', a: 'start' });
  d.rect(110, 40, 300, 22, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(260, 51, '/report (slow, 900 ms)', { cls: 'xs' });
  [0, 1, 2].forEach((i) => { d.rect(414 + i * 64, 40, 60, 22, { r: 3, fill: C.paper, stroke: C.line }); d.text(444 + i * 64, 51, 'waits', { cls: 'xs' }); });
  for (let c = 2; c <= 6; c++) { d.text(20, 50 + (c - 1) * 32, `connection ${c}`, { cls: 'sm', a: 'start' }); for (let k = 0; k < 5; k++) d.rect(110 + k * 64, 40 + (c - 1) * 32, 60, 22, { r: 3, fill: C.card, stroke: C.ink2 }); }
  d.text(320, 260, 'browsers open about six connections per host to work around this; 30 resources need 5 rounds', { cls: 'xs' });
  return d.svg();
}

export function be_http2_frames() {
  const d = fig('be_http2_frames', 'HTTP/2: STREAMS CUT INTO FRAMES AND INTERLEAVED ON ONE CONNECTION', 270);
  const seq = [1, 3, 1, 5, 3, 3, 1, 5, 5, 3, 1, 5];
  d.line(20, 120, 620, 120, { stroke: C.ink2, sw: 2, single: true }); d.line(20, 160, 620, 160, { stroke: C.ink2, sw: 2, single: true });
  seq.forEach((s, i) => { const hot = s === 3; d.rect(26 + i * 49, 126, 44, 28, { r: 3, fill: hot ? C.accSoft : s === 1 ? C.card : C.paper, stroke: hot ? C.acc : C.ink2 }); d.mono(48 + i * 49, 140, `s${s}`, { size: 10, color: hot ? C.acc : undefined }); });
  d.text(320, 96, 'one TCP + TLS connection', { cls: 'sm' });
  d.text(320, 200, 'each frame carries a stream id; the receiver reassembles stream 3 on its own', { cls: 'xs' });
  d.text(320, 222, 'client streams use odd ids: 1, 3, 5, ...', { cls: 'xs' });
  return d.svg();
}

export function be_http2_hpack() {
  const d = fig('be_http2_hpack', 'HPACK: REPEATED HEADERS BECOME SMALL TABLE INDEXES', 300);
  card(d, 20, 50, 270, [':method: GET', ':path: /orders/123', 'authorization: Bearer eyJ...', 'user-agent: WrenApp/5.2'], { title: 'first request: literal, then added to table' });
  d.grid(330, 50, 4, 2, 140, 26, { val: (r, c) => [['62', 'authorization: Bearer ...'], ['63', 'user-agent: WrenApp/5.2'], ['2', ':method GET'], ['5', ':path /'],][r][c], cellFill: (r) => (r < 2 ? C.accSoft : null), vsize: 9 });
  d.text(470, 40, 'dynamic + static table', { cls: 'xs' });
  card(d, 20, 190, 270, ['index 2', ':path: /orders/124', 'index 62', 'index 63'], { title: 'second request: mostly indexes', hot: [2, 3] });
  d.hand(470, 240, 'tokens sent once');
  return d.svg();
}

export function be_http2_tcp_hol() {
  const d = fig('be_http2_tcp_hol', 'ONE LOST TCP PACKET STALLS EVERY HTTP/2 STREAM BEHIND IT', 260);
  const seq = [1, 3, 5, 1, 3, 5, 1, 3];
  seq.forEach((s, i) => { const lost = i === 2; d.rect(40 + i * 70, 100, 60, 34, { r: 3, fill: lost ? C.paper : C.card, stroke: lost ? C.acc : C.ink2, dash: lost ? [4, 3] : undefined }); d.mono(70 + i * 70, 117, `s${s}`, { size: 10 }); if (lost) cross(d, 70 + i * 70, 117, 9); });
  d.brace(250, 600, 150, { label: 'delivered later only after the retransmit, in order' });
  d.text(320, 220, 'TCP promises one ordered byte stream, so streams 1 and 3 wait for stream 5', { cls: 'xs' });
  return d.svg();
}

export function be_http3_quic() {
  const d = fig('be_http3_quic', 'HTTP/3 ON QUIC: LOSS ON STREAM 5 DELAYS ONLY STREAM 5', 280);
  [1, 3, 5].forEach((s, r) => {
    const y = 60 + r * 60;
    d.text(30, y + 17, `stream ${s}`, { cls: 'sm', a: 'start' });
    [0, 1, 2, 3].forEach((k) => { const lost = s === 5 && k === 1; d.rect(110 + k * 80, y, 70, 34, { r: 3, fill: lost ? C.paper : s === 5 ? C.accFaint : C.card, stroke: lost || s === 5 ? C.acc : C.ink2, dash: lost ? [4, 3] : undefined }); if (lost) cross(d, 145 + k * 80, y + 17, 8); });
    d.text(470, y + 17, s === 5 ? 'waits for retransmit' : 'delivered now', { cls: 'sm', a: 'start', color: s === 5 ? C.acc : undefined });
  });
  d.text(320, 250, 'QUIC runs over UDP and orders bytes per stream, not per connection', { cls: 'xs' });
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
  const d = fig('be_tls_history', 'SSL BECAME TLS; EVERYTHING BEFORE TLS 1.2 IS NOW RETIRED', 230);
  const ev = [['SSL 2.0', 1995], ['SSL 3.0', 1996], ['TLS 1.0', 1999], ['TLS 1.1', 2006], ['TLS 1.2', 2008], ['TLS 1.3', 2018]];
  const X = (y) => 40 + (y - 1994) * 23.5;
  d.arrow(30, 120, 620, 120, { stroke: C.gray });
  ev.forEach(([s, y], i) => { const ok = y >= 2008; d.dot(X(y), 120, 4, ok ? C.acc : C.ink2); d.text(X(y), i % 2 ? 150 : 90, s, { cls: 'ttl', size: 11, color: ok ? C.acc : undefined }); d.mono(X(y), i % 2 ? 168 : 72, String(y), { size: 9 }); });
  d.text(320, 205, 'TLS 1.0 and 1.1 were formally deprecated in 2021 (RFC 8996)', { cls: 'xs' });
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
  const d = fig('be_tls_cipher_suite', 'READING A CIPHER SUITE NAME', 260);
  d.chips(40, 60, ['TLS', 'AES_128_GCM', 'SHA256'], { h: 30, size: 12, fill: (i) => (i === 1 ? C.accSoft : C.card), stroke: (i) => (i === 1 ? C.acc : C.ink2) });
  d.text(70, 110, 'TLS 1.3', { cls: 'xs' }); d.text(170, 110, 'record cipher (AEAD)', { cls: 'xs' }); d.text(270, 110, 'handshake hash', { cls: 'xs' });
  d.chips(40, 160, ['ECDHE', 'RSA', 'AES_256_GCM', 'SHA384'], { h: 30, size: 11 });
  d.text(64, 210, 'key exchange', { cls: 'xs' }); d.text(126, 230, 'signature', { cls: 'xs' }); d.text(208, 210, 'cipher', { cls: 'xs' }); d.text(296, 230, 'hash', { cls: 'xs' });
  d.text(520, 75, 'TLS 1.3 suite', { cls: 'ttl' }); d.text(520, 175, 'TLS 1.2 suite', { cls: 'ttl' });
  return d.svg();
}

export function be_tls_rtt() {
  const d = fig('be_tls_rtt', 'ROUND TRIPS BEFORE THE FIRST RESPONSE BYTE, AT 40 MS RTT AND 30 MS SERVER TIME', 300);
  hbars(d, [['TCP + TLS 1.2', 215, '215 ms'], ['TCP + TLS 1.3', 175, '175 ms', true], ['QUIC (HTTP/3)', 135, '135 ms'], ['QUIC 0-RTT resume', 95, '95 ms'], ['reused connection', 70, '70 ms']], { y: 56, gap: 44, w: 330 });
  d.text(320, 280, 'each includes 25 ms of illustrative DNS lookup except the reused connection', { cls: 'xs' });
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
  const d = fig('be_cert_validate', 'WHAT THE CLIENT CHECKS BEFORE IT SENDS A SINGLE HEADER', 300);
  const c = ['chain ends at a trusted root', 'every signature verifies', 'now is between notBefore and notAfter', 'SAN lists api.wren.example', 'not revoked (OCSP or CRL)', 'server proves the private key (CertificateVerify)'];
  c.forEach((s, i) => { const y = 50 + i * 38; d.rect(60, y, 30, 26, { r: 4, fill: C.accSoft, stroke: C.acc }); tick(d, 75, y + 13, 7); d.text(110, y + 13, s, { cls: 'sm', a: 'start' }); });
  d.hand(520, 150, 'any no:\nconnection fails', { vc: true });
  return d.svg();
}

export function be_cert_expiry() {
  const d = fig('be_cert_expiry', 'A 90-DAY CERTIFICATE RENEWED AT DAY 60 LEAVES 30 DAYS TO NOTICE FAILURE', 250);
  const X = (t) => 50 + t * 5.8;
  d.arrow(40, 130, 610, 130, { stroke: C.gray });
  d.rect(X(0), 100, X(60) - X(0), 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text((X(0) + X(60)) / 2, 115, 'valid', { cls: 'sm' });
  d.rect(X(60), 100, X(90) - X(60), 30, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text((X(60) + X(90)) / 2, 115, 'renewal window', { cls: 'sm' });
  [0, 60, 90].forEach((t) => d.mono(X(t), 150, `day ${t}`, { size: 9.5 }));
  d.text(320, 200, 'alert when any certificate in production has fewer than 14 days left', { cls: 'xs' });
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
  const d = fig('be_dns_records', 'THE WREN ZONE: EACH RECORD TYPE ANSWERS A DIFFERENT QUESTION', 330);
  card(d, 20, 44, 380, ['wren.example. zone', 'api     300  A      203.0.113.10', 'api     300  AAAA   2001:db8::10', 'www     300  CNAME  wren.cdn.example.', '@       3600 MX     10 mail.wren.example.', '@       3600 TXT    "v=spf1 include:..."', '@     86400  NS     ns1.dns.example.', '_grpc._tcp.orders  SRV  0 5 8443 orders...'], { hot: [1], lh: 30 });
  [['A', 'IPv4 address'], ['AAAA', 'IPv6 address'], ['CNAME', 'alias to another name'], ['MX', 'where mail goes'], ['TXT', 'free text: SPF, verification'], ['NS', 'who is authoritative'], ['SRV', 'host and port of a service']].forEach(([t, s], i) => { d.mono(420, 99 + i * 30, t, { a: 'start', size: 10, color: i === 0 ? C.acc : undefined }); d.text(470, 99 + i * 30, s, { cls: 'xs', a: 'start' }); });
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
  const d = fig('be_dns_ttl', 'EVERY CACHE ON THE PATH COUNTS THE TTL DOWN ON ITS OWN CLOCK', 260);
  [['browser', 300, 120], ['OS', 300, 200], ['recursive', 300, 41]].forEach(([s, tot, left], i) => {
    const y = 60 + i * 50;
    d.text(110, y + 12, s, { cls: 'sm', a: 'end' });
    d.rect(130, y, 400, 24, { r: 3, fill: C.paper, stroke: C.line });
    d.rect(130, y, 400 * left / tot, 24, { r: 3, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 });
    d.mono(540, y + 12, `${left} s left`, { a: 'start', size: 10 });
  });
  d.text(320, 225, 'negative answers (NXDOMAIN) are cached too, for the SOA minimum TTL', { cls: 'xs' });
  return d.svg();
}

export function be_dns_routing() {
  const d = fig('be_dns_routing', 'THE AUTHORITATIVE SERVER CAN ANSWER DIFFERENTLY PER ASKER', 300);
  panel(d, 20, 40, 190, 220, 'weighted');
  d.mono(115, 100, '90% -> v1 pool', { size: 10 }); d.mono(115, 125, '10% -> v2 pool', { size: 10, color: C.acc });
  panel(d, 225, 40, 190, 220, 'geographic', true);
  d.mono(320, 100, 'India -> 203.0.113.20', { size: 9.5 }); d.mono(320, 125, 'EU -> 203.0.113.30', { size: 9.5 });
  panel(d, 430, 40, 190, 220, 'failover');
  d.mono(525, 100, 'primary healthy?', { size: 9.5 }); d.mono(525, 125, 'no -> standby IP', { size: 9.5 });
  d.text(320, 230, 'all three still obey TTLs: changes reach clients only as caches expire', { cls: 'xs' });
  return d.svg();
}

export function be_dns_stale() {
  const d = fig('be_dns_stale', 'MIGRATING api.wren.example: LOWER THE TTL FIRST, THEN MOVE, THEN KEEP THE OLD SERVER UP', 300);
  const X = (t) => 50 + t * 52;
  d.arrow(40, 150, 620, 150, { stroke: C.gray });
  [['TTL 300 -> 60', 0], ['wait > 300 s', 2], ['change A record', 4], ['old IP still hit', 6], ['decommission', 10]].forEach(([s, t], i) => { d.dot(X(t), 150, 4, i === 2 ? C.acc : C.ink); d.text(X(t), i % 2 ? 185 : 115, s, { cls: 'sm', color: i === 2 ? C.acc : undefined }); });
  d.rect(X(4), 160, X(10) - X(4), 10, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.text(320, 250, 'some resolvers and long-lived clients ignore TTLs, so watch traffic on the old IP before turning it off', { cls: 'xs' });
  return d.svg();
}

export function be_e2e_request() {
  const d = fig('be_e2e_request', 'GET https://api.wren.example/orders/123, FROM TYPING TO JSON', 360);
  const st = [['DNS', 'A 203.0.113.10'], ['TCP', 'SYN, SYN-ACK, ACK'], ['TLS 1.3', 'keys + cert check'], ['HTTP/2', 'HEADERS frame'], ['load balancer', 'terminates TLS'], ['Wren app', 'auth, query'], ['PostgreSQL', 'order 123'], ['response', '200, 2,000 B']];
  st.forEach(([a, b], i) => {
    const r = Math.floor(i / 4), c = r ? 3 - (i % 4) : i % 4, x = 24 + c * 152, y = 60 + r * 140;
    const hot = i === 2;
    d.rect(x, y, 132, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 66, y + 24, a, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(x + 66, y + 44, b, { cls: 'xs' });
    if (i % 4 < 3 && i < 7) d.arrow(r ? x - 4 : x + 136, y + 32, r ? x - 16 : x + 148, y + 32, { stroke: C.gray, hl: 5 });
    if (i === 3) d.arrow(x + 66, y + 68, x + 66, y + 136, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 320, 'each box is a part of this chapter; the next chapters open the app box', { cls: 'xs' });
  return d.svg();
}

export function be_e2e_layers() {
  const d = fig('be_e2e_layers', 'WHAT EACH LAYER CONTRIBUTES TO ONE REQUEST', 300);
  const c = [['DNS', 'name to address, with a TTL'], ['TCP or QUIC', 'reliable, ordered delivery'], ['TLS', 'secrecy, integrity, server identity'], ['certificates', 'why we believe the identity'], ['HTTP', 'method, target, status, headers'], ['caching headers', 'when not to ask at all']];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 82; d.rect(x, y, 290, 66, { r: 7, fill: i === 2 ? C.accFaint : C.card, stroke: i === 2 ? C.acc : C.line }); d.text(x + 14, y + 22, t, { cls: 'ttl', a: 'start' }); d.text(x + 14, y + 44, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

export function be_e2e_waterfall() {
  const d = fig('be_e2e_waterfall', 'COLD START WATERFALL FOR GET /orders/123 OVER TCP + TLS 1.3: 175 MS', 300);
  const X = (t) => 120 + t * 2.6;
  const rows = [['DNS lookup', 0, 25], ['TCP handshake', 25, 65], ['TLS 1.3', 65, 105], ['request out', 105, 125], ['server work', 125, 155], ['response back', 155, 175]];
  rows.forEach(([s, a, b], i) => { const y = 50 + i * 34; d.text(110, y + 11, s, { cls: 'sm', a: 'end' }); d.rect(X(a), y, X(b) - X(a), 22, { r: 3, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 }); d.mono(X(b) + 6, y + 11, `${b} ms`, { a: 'start', size: 9 }); });
  d.line(X(0), 260, X(175), 260, { stroke: C.gray, single: true });
  d.text(320, 282, 'only the orange 30 ms is Wren code; the other 145 ms is distance', { cls: 'xs' });
  return d.svg();
}

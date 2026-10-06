import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser, hourglass, signpost, gauge, bubble } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Origins and the same-origin policy', 'CORS: simple and preflight requests', 'CORS credentials and caching', 'CORS vulnerabilities', 'Cookies', 'SameSite and third-party cookies', 'CSRF', 'The browser boundary end to end'];
function cookie(d, x, y, r, o = {}) {
  d.circle(x, y, r * 2, { fill: o.fill ?? C.accSoft, stroke: o.stroke ?? C.acc });
  [[-0.4, -0.3], [0.3, -0.4], [0.1, 0.3], [-0.3, 0.4], [0.45, 0.2]].forEach(([a, b]) => d.dot(x + a * r, y + b * r, Math.max(1.4, r * 0.1), o.stroke ?? C.acc));
  if (o.label) d.text(x, y + r + 14, o.label, { cls: 'xs', color: o.lc });
}

function house(d, x, y, w, label, o = {}) {
  const st = o.stroke ?? C.ink2;
  d.poly([[x, y + w * 0.4], [x + w / 2, y], [x + w, y + w * 0.4]], { fill: o.roof ?? C.card, stroke: st });
  d.rect(x + 4, y + w * 0.4, w - 8, w * 0.55, { r: 0, fill: o.fill ?? C.paper, stroke: st });
  d.rect(x + w / 2 - 7, y + w * 0.6, 14, w * 0.35, { r: 1, fill: C.card, stroke: st, sw: 0.8 });
  if (label) d.mono(x + w / 2, y + w + 12, label, { size: o.size ?? 9, color: o.lc });
}

function stamp(d, x, y, text, o = {}) {
  d.rect(x, y, o.w ?? 110, 26, { r: 3, fill: 'none', stroke: o.stroke ?? C.acc, sw: 1.6 });
  d.text(x + (o.w ?? 110) / 2, y + 13, text, { cls: 'mono', size: 9.5, color: o.stroke ?? C.acc, w: 600 });
}

export const where_be_browser = (stage = 99) => beMap('where_be_browser', PARTS, stage);

export const cover_be_browser = () => beCover('cover_be_browser', 'II', ['Origins, CORS', 'and cookies'], 'What a browser lets one site do to another', (d, y) => {
  browser(d, 30, y + 30, 250, 170, 'https://evil.example');
  d.mono(155, y + 100, 'fetch(api.wren...)', { size: 10 });
  browser(d, 360, y + 30, 250, 170, 'https://app.wren.example', { urlColor: C.acc });
  d.doc(440, y + 80, 90, 90, { fill: C.accSoft, stroke: C.acc }); d.text(485, y + 185, 'cookie: sid', { cls: 'xs' });
  shield(d, 320, y + 70, 60, { fill: C.accSoft, stroke: C.acc, label: 'SOP' });
  d.arrow(282, y + 120, 296, y + 120, { stroke: C.acc });
  cross(d, 300, y + 150, 8);
  d.text(320, y + 250, 'the browser stands between them', { cls: 'sm' });
}, [['Origins', 'scheme, host, port'], ['CORS', 'who may read a response'], ['Cookies', 'scope, flags, SameSite'], ['CSRF', 'forged writes and their defences']]);

export function be_origin_parts() {
  const d = fig('be_origin_parts', 'AN ORIGIN IS THREE PARTS OF THE URL; THE PATH IS NOT ONE OF THEM', 280);
  browser(d, 30, 50, 580, 120, '');
  const P = [['https', 70, true], ['://', 112, false], ['app.wren.example', 210, true], [':443', 305, true], ['/orders/123?x=1', 400, false]];
  P.forEach(([s, x, hot]) => { d.mono(x, 61, s, { size: 10.5, color: hot ? C.acc : C.gray }); });
  d.brace(56, 330, 80, { label: 'origin: scheme + host + port' }); d.text(410, 96, 'path and query: ignored', { cls: 'xs' });
  house(d, 260, 120, 50, ''); d.text(320, 200, 'one origin = one house; every page inside shares it', { cls: 'xs' });
  d.text(320, 246, 'the default port is implied: https://app.wren.example means port 443', { cls: 'xs' });
  return d.svg();
}

export function be_origin_table() {
  const d = fig('be_origin_table', 'COMPARED WITH https://app.wren.example: SAME ORIGIN? SAME SITE?', 340);
  d.rect(30, 50, 580, 250, { r: 6, fill: C.paper, stroke: C.line });
  d.rect(40, 130, 560, 160, { r: 4, fill: 'none', stroke: C.ink2, dash: [5, 3] }); d.text(46, 142, 'site: https + wren.example', { cls: 'xs', a: 'start' });
  house(d, 60, 160, 60, 'app (itself)', { fill: C.accSoft, stroke: C.acc, lc: C.acc }); house(d, 180, 160, 60, 'app:8443'); house(d, 300, 160, 60, 'api'); house(d, 420, 160, 60, 'wren.example');
  house(d, 520, 60, 50, 'evil.example', { stroke: C.gray }); house(d, 60, 60, 50, 'http://app', { stroke: C.gray });
  d.text(320, 84, 'other sites: other scheme or registrable domain', { cls: 'xs' });
  d.text(320, 318, 'same origin needs the exact scheme, host and port; same site only the scheme and registrable domain', { cls: 'xs' });
  return d.svg();
}

export function be_sop_rules() {
  const d = fig('be_sop_rules', 'THE SAME-ORIGIN POLICY: WRITES AND EMBEDS GO OUT, READS DO NOT COME BACK', 300);
  browser(d, 20, 50, 230, 200, 'https://evil.example');
  d.server(500, 100, 90, 120, { label: 'api.wren.example' });
  [['<form> POST: sent', 90, C.ink2, false], ['<img>, <script>: sent, rendered', 140, C.ink2, false], ['fetch() response: hidden', 190, C.acc, true]].forEach(([s, y, col, hot]) => {
    d.arrow(256, y, 490, y, { stroke: col, hl: 6 });
    d.text(372, y - 10, s, { cls: 'sm', color: hot ? C.acc : undefined });
  });
  cross(d, 300, 220, 8);
  d.arrow(490, 220, 312, 220, { stroke: C.acc, dash: [4, 3] });
  d.text(400, 238, 'response body kept from the script', { cls: 'xs' });
  return d.svg();
}

export function be_fetch_headers() {
  const d = fig('be_fetch_headers', 'THE BROWSER TELLS THE SERVER WHERE A REQUEST CAME FROM, AND SCRIPTS CANNOT FORGE IT', 320);
  d.envelope(30, 60, 300, 200, {});
  ['POST /orders HTTP/2', 'Origin: https://evil.example', 'Referer: https://evil.example/win', 'Sec-Fetch-Site: cross-site', 'Sec-Fetch-Mode: navigate', 'Cookie: __Host-sid=8f2c…'].forEach((s, i) => d.mono(50, 140 + i * 18, s, { a: 'start', size: 9, color: [1, 3].includes(i) ? C.acc : undefined }));
  stamp(d, 200, 80, 'BROWSER-SET', { w: 110 });
  d.text(480, 90, 'Origin: who started it', { cls: 'xs' }); d.text(480, 106, '(scheme, host, port only)', { cls: 'xs' });
  d.text(480, 150, 'Sec-Fetch-Site: same-origin,', { cls: 'xs' }); d.text(480, 166, 'same-site, cross-site or none', { cls: 'xs' });
  d.laptop(430, 200, 70); d.text(560, 230, 'curl can set them all;', { cls: 'xs' }); d.text(560, 246, 'a page cannot', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_cors_why() {
  const d = fig('be_cors_why', 'CORS IS THE SERVER TELLING THE BROWSER WHICH OTHER ORIGINS MAY READ ITS ANSWER', 290);
  browser(d, 20, 50, 220, 180, 'https://app.wren.example', { urlColor: C.acc });
  d.mono(130, 130, 'fetch(api...)', { size: 10 });
  d.server(500, 80, 90, 120, { label: 'api.wren.example' });
  say(d, 246, 490, 110, 'GET /me + Origin: app.wren...');
  say(d, 490, 246, 160, 'Access-Control-Allow-Origin: https://app.wren.example', { hot: true, size: 8.5 });
  d.text(130, 250, 'browser compares, then\nhands the body to the script', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cors_simple() {
  const d = fig('be_cors_simple', 'A SIMPLE REQUEST GOES STRAIGHT OUT; THE CHECK HAPPENS ON THE WAY BACK', 300);
  const xs = actors(d, ['script', 'browser', 'api.wren.example'], 44, 280, { x0: 90, x1: 550, hot: 1 });
  say(d, xs[0], xs[1], 96, 'fetch GET /menu');
  say(d, xs[1], xs[2], 126, 'GET /menu, Origin: https://partner.example');
  say(d, xs[2], xs[1], 166, '200 + ACAO: https://partner.example');
  d.rect(xs[1] - 50, 182, 100, 34, { r: 5, fill: C.accSoft, stroke: C.acc }); d.text(xs[1], 199, 'origins match?', { cls: 'xs' });
  say(d, xs[1], xs[0], 240, 'response visible', { hot: true });
  d.text(320, 270, 'the server already ran the request; CORS only controls who sees the result', { cls: 'xs' });
  return d.svg();
}

export function be_cors_preflight() {
  const d = fig('be_cors_preflight', 'A PREFLIGHT ASKS PERMISSION BEFORE THE REAL REQUEST IS SENT', 340);
  const xs = actors(d, ['browser', 'api.wren.example'], 44, 320, { x0: 150, x1: 490 });
  say(d, xs[0], xs[1], 100, 'OPTIONS /orders/123', { hot: true });
  d.text(320, 120, 'Access-Control-Request-Method: PUT; -Headers: content-type', { cls: 'mono', size: 8.5 });
  say(d, xs[1], xs[0], 160, '204 + Allow-Origin, -Methods: PUT, -Headers, Max-Age: 600', { size: 8.5 });
  say(d, xs[0], xs[1], 220, 'PUT /orders/123 (application/json)');
  say(d, xs[1], xs[0], 260, '200 + Allow-Origin');
  d.text(320, 300, 'if the preflight says no, the PUT is never sent', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_cors_simple_vs_preflight() {
  const d = fig('be_cors_simple_vs_preflight', 'IS A PREFLIGHT NEEDED? THREE QUESTIONS', 320);
  const q = ['GET, HEAD or POST?', 'only safelisted headers?', 'form, multipart or text/plain?'];
  q.forEach((s, i) => { const y = 60 + i * 70; signpost(d, 150, y + 26, s, { pole: 30, w: 230 }); d.arrow(270, y + 14, 400, 150, { stroke: C.acc, hl: 5 }); d.text(320, y + 4 + i * 8, 'no', { cls: 'xs', color: C.acc }); });
  d.rect(410, 120, 190, 60, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(505, 150, 'preflight OPTIONS first', { cls: 'sm', color: C.acc });
  d.text(150, 290, 'all yes: simple request, no preflight', { cls: 'sm' });
  d.text(505, 220, 'JSON bodies and Authorization', { cls: 'xs' }); d.text(505, 236, 'headers always trigger it', { cls: 'xs' });
  return d.svg();
}

export function be_cors_headers() {
  const d = fig('be_cors_headers', 'THE SIX CORS RESPONSE HEADERS AND WHAT EACH ONE UNLOCKS', 320);
  d.doc(20, 50, 380, 240, { fill: C.paper, lines: false }); d.mono(34, 70, 'HTTP/2 204', { a: 'start', size: 9.5 });
  const H = [['Allow-Origin: https://app.wren.example', 'who may read'], ['Allow-Methods: GET, PUT, DELETE', 'methods allowed'], ['Allow-Headers: content-type, x-request-id', 'request headers allowed'], ['Allow-Credentials: true', 'cookies sent and read'], ['Expose-Headers: x-request-id', 'headers scripts can see'], ['Max-Age: 600', 'seconds to cache the preflight']];
  H.forEach(([h, s], i) => { const y = 100 + i * 30; d.key(34, y, 22, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(64, y, h, { a: 'start', size: 8.5, color: i === 0 ? C.acc : undefined }); d.text(420, y, s, { cls: 'xs', a: 'start' }); d.line(402, y, 414, y, { stroke: C.line, single: true }); });
  d.text(210, 304, 'all prefixed Access-Control-', { cls: 'xs' });
  return d.svg();
}

export function be_cors_credentials() {
  const d = fig('be_cors_credentials', 'WITH CREDENTIALS, THE WILDCARD IS REFUSED: NAME THE ORIGIN', 300);
  panel(d, 20, 40, 290, 230, 'rejected by the browser');
  d.mono(165, 80, 'ACAO: *  +  ACAC: true', { size: 10, color: C.acc }); cookie(d, 120, 150, 22); d.text(165, 210, 'any site could read a', { cls: 'xs' }); d.text(165, 226, 'logged-in user\'s data', { cls: 'xs' }); cross(d, 220, 150, 14);
  panel(d, 330, 40, 290, 230, 'accepted', true);
  d.mono(475, 80, 'ACAO: https://app.wren.example', { size: 9 }); d.mono(475, 100, 'ACAC: true · Vary: Origin', { size: 9 });
  house(d, 400, 120, 60, 'app.wren', { fill: C.accSoft, stroke: C.acc }); cookie(d, 520, 160, 20); tick(d, 560, 210, 10);
  return d.svg();
}

export function be_cors_allowlist() {
  const d = fig('be_cors_allowlist', 'SAFE DYNAMIC CORS: EXACT STRING MATCH AGAINST A SET', 300);
  d.envelope(30, 60, 150, 50, {}); d.mono(105, 125, 'Origin: partner.example', { size: 9, color: C.acc });
  d.envelope(30, 160, 150, 50, {}); d.mono(105, 225, 'Origin: evil.example', { size: 9 });
  d.doc(250, 60, 150, 150, { fill: C.paper, lines: false }); d.text(325, 78, 'ALLOWED set', { cls: 'ttl', size: 11 }); ['https://app.wren.example', 'https://partner.example'].forEach((s, i) => { tick(d, 266, 108 + i * 30, 6, i ? C.acc : C.ink2); d.mono(280, 108 + i * 30, s, { a: 'start', size: 8.5 }); });
  d.arrow(184, 85, 246, 110, { stroke: C.acc, hl: 5 }); d.arrow(184, 185, 246, 170, { stroke: C.gray, hl: 5 });
  d.text(520, 100, 'echo it back', { cls: 'sm', color: C.acc }); d.text(520, 118, '+ Vary: Origin', { cls: 'xs' }); d.arrow(404, 110, 460, 105, { stroke: C.acc, hl: 5 });
  d.text(520, 180, 'no CORS headers', { cls: 'sm' }); d.arrow(404, 170, 460, 180, { stroke: C.gray, hl: 5 });
  d.text(320, 270, 'parse, then compare whole strings; never startswith, endswith or an unanchored regex', { cls: 'xs' });
  return d.svg();
}

export function be_cors_vary() {
  const d = fig('be_cors_vary', 'WITHOUT Vary: Origin, A CACHE SERVES ONE ORIGIN\'S CORS ANSWER TO ANOTHER', 310);
  house(d, 40, 50, 60, 'partner', {}); house(d, 40, 180, 60, 'app.wren', {});
  d.server(270, 100, 90, 100, { label: 'CDN cache' }); d.rect(370, 120, 110, 40, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(425, 132, '/menu', { size: 9 }); d.mono(425, 148, 'ACAO: partner', { size: 8.5, color: C.acc });
  d.arrow(110, 90, 266, 130, { stroke: C.ink2, hl: 5 }); d.text(180, 92, '1st: Origin partner', { cls: 'xs' });
  d.arrow(110, 220, 266, 180, { stroke: C.ink2, hl: 5 }); d.text(180, 230, '2nd: Origin app.wren', { cls: 'xs' });
  d.arrow(266, 190, 112, 240, { stroke: C.acc, hl: 5, dash: [4, 3] }); cross(d, 120, 270, 8); d.text(260, 280, 'gets ACAO: partner, browser blocks it', { cls: 'xs', color: C.acc });
  d.text(540, 220, 'with Vary: Origin,', { cls: 'xs' }); d.text(540, 236, 'one entry per origin', { cls: 'xs' });
  return d.svg();
}

export function be_cors_maxage() {
  const d = fig('be_cors_maxage', '120 PUTS IN 10 MINUTES: PREFLIGHT CACHING HALVES THE REQUESTS', 300);
  [['no Max-Age', 240, 0], ['Max-Age: 600', 121, 1]].forEach(([s, n, i]) => { const y = 70 + i * 90; d.text(130, y + 20, s, { cls: 'sm', a: 'end', color: i ? C.acc : undefined }); for (let k = 0; k < 40; k++) { const pre = i ? k === 0 : k % 2 === 0; d.envelope(144 + k * 11, y + (pre ? 0 : 20), 10, 8, { fill: pre ? C.accSoft : C.card, stroke: pre ? C.acc : C.ink2, sw: 0.6 }); } d.mono(600, y + 20, `${n}`, { size: 10, a: 'end', color: i ? C.acc : undefined }); });
  d.text(330, 62, 'orange: OPTIONS preflights · grey: the PUTs (first 40 shown)', { cls: 'xs' });
  d.text(320, 260, 'Chromium caps Max-Age at 7,200 s; the cache is per origin, URL and request shape', { cls: 'xs' });
  return d.svg();
}

export function be_cors_null() {
  const d = fig('be_cors_null', 'MANY UNRELATED CONTEXTS SEND Origin: null', 300);
  [['sandboxed iframe', 80], ['file:// page', 240], ['some redirects', 400], ['data: URL', 560]].forEach(([s, x], i) => { browser(d, x - 60, 60, 120, 70, ''); d.text(x, 108, s, { cls: 'xs' }); d.arrow(x, 134, 320, 200, { stroke: C.gray, hl: 5 }); });
  d.rect(250, 200, 140, 34, { r: 17, fill: C.accSoft, stroke: C.acc }); d.mono(320, 217, 'Origin: null', { size: 11, color: C.acc });
  d.text(320, 268, 'an attacker can produce it on purpose; never put "null" in the allowlist', { cls: 'xs' });
  return d.svg();
}

export function be_cors_reflect_attack() {
  const d = fig('be_cors_reflect_attack', 'REFLECTING ANY ORIGIN WITH CREDENTIALS LETS EVIL.EXAMPLE READ THE VICTIM\'S DATA', 340);
  const xs = actors(d, ['evil.example page', 'victim browser', 'api.wren.example'], 44, 320, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 96, 'fetch("/me", {credentials:"include"})');
  say(d, xs[1], xs[2], 136, 'GET /me, Origin: evil.example, Cookie: sid');
  say(d, xs[2], xs[1], 176, '200 {email, address} + ACAO: evil.example + ACAC: true', { hot: true, size: 8.5 });
  say(d, xs[1], xs[0], 216, 'body handed to the script', { hot: true });
  say(d, xs[0], 610, 256, 'POST to attacker server', { color: C.gray });
  d.text(320, 300, 'the server mirrored Origin into ACAO with no check', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_cors_regex() {
  const d = fig('be_cors_regex', 'CHECKS THAT LOOK RIGHT AND ARE NOT', 320);
  const rows = [['endswith("wren.example")', 'evilwren.example', true], ['startswith("https://app.wren.example")', 'app.wren.example.evil.com', true], ['regex app.wren.example (dot unescaped)', 'appXwren.example', true], ['^https://app\\.wren\\.example$', 'app.wren.example', false]];
  rows.forEach(([chk, o, bad], i) => { const y = 60 + i * 62; d.rect(30, y - 14, 300, 28, { r: 4, fill: C.paper, stroke: C.ink2 }); d.mono(40, y, chk, { a: 'start', size: 8.5 }); d.arrow(334, y, 380, y, { stroke: bad ? C.acc : C.gray, hl: 5 }); house(d, 390, y - 24, 40, '', { stroke: bad ? C.acc : C.ink2, fill: bad ? C.accSoft : C.paper }); d.mono(445, y, o, { a: 'start', size: 8.5, color: bad ? C.acc : undefined }); if (bad) cross(d, 610, y, 7); else tick(d, 610, y, 7); });
  return d.svg();
}

export function be_cors_subdomain() {
  const d = fig('be_cors_subdomain', 'TRUSTING *.wren.example MEANS TRUSTING THE WEAKEST SUBDOMAIN', 300);
  d.server(270, 110, 100, 110, { label: 'api.wren.example' });
  [['app.wren.example', 50, false], ['blog.wren.example\n(old plugin, XSS)', 150, true], ['promo.wren.example\n(dangling CNAME)', 250, true]].forEach(([s, y, hot]) => { d.rect(20, y - 25, 180, 50, { r: 7, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(110, y, s, { cls: 'sm', vc: true }); d.arrow(204, y, 264, 165, { stroke: hot ? C.acc : C.gray, hl: 5 }); });
  d.text(500, 140, 'any script running on\nany subdomain can read\nAPI responses as the user', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cors_not_auth() {
  const d = fig('be_cors_not_auth', 'CORS IS ENFORCED BY BROWSERS ONLY, AND ONLY ON READS', 320);
  panel(d, 20, 40, 290, 250, 'curl or a server');
  d.laptop(110, 80, 110); d.mono(165, 182, 'curl -H "Origin: x" …/me', { size: 9 });
  d.text(165, 222, 'no browser, no CORS check;', { cls: 'xs' }); d.text(165, 238, 'authentication is what stops it', { cls: 'xs' });
  panel(d, 330, 40, 290, 250, 'a cross-site form POST', true);
  browser(d, 360, 74, 120, 70, 'evil.example'); d.server(530, 76, 60, 70, {}); d.arrow(484, 110, 526, 110, { stroke: C.acc, hl: 5 }); cookie(d, 505, 92, 9);
  d.text(475, 180, 'browser sends it with cookies;', { cls: 'xs' }); d.text(475, 196, 'the server places the order', { cls: 'xs', color: C.acc });
  d.text(475, 238, 'the response is hidden: that is', { cls: 'xs' }); d.text(475, 254, 'CSRF, not a CORS problem', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_flow() {
  const d = fig('be_cookie_flow', 'THE SERVER SETS A COOKIE ONCE; THE BROWSER ATTACHES IT TO EVERY MATCHING REQUEST', 300);
  const xs = actors(d, ['browser', 'api.wren.example'], 44, 280, { x0: 150, x1: 490 });
  say(d, xs[0], xs[1], 96, 'POST /login');
  say(d, xs[1], xs[0], 132, 'Set-Cookie: __Host-sid=8f2c; Secure; HttpOnly; SameSite=Lax', { hot: true, size: 8.5 });
  say(d, xs[0], xs[1], 186, 'GET /orders, Cookie: __Host-sid=8f2c');
  say(d, xs[0], xs[1], 226, 'GET /menu, Cookie: __Host-sid=8f2c');
  d.text(320, 262, 'the attributes stay in the browser; only name=value is sent back', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_scope() {
  const d = fig('be_cookie_scope', 'DOMAIN AND PATH DECIDE WHICH REQUESTS CARRY A COOKIE', 330);
  house(d, 280, 40, 80, 'wren.example');
  [['app.wren.example', 110], ['api.wren.example', 320], ['blog.wren.example', 530]].forEach(([s, x], i) => { d.line(320, 120, x, 150, { stroke: C.line, single: true }); house(d, x - 30, 150, 60, s, { fill: i === 1 ? C.accSoft : C.paper, stroke: i === 1 ? C.acc : C.ink2 }); });
  cookie(d, 340, 186, 10, {}); d.mono(150, 250, 'a=1 (host-only): api only', { size: 9, color: C.acc });
  [110, 320, 530].forEach((x) => cookie(d, x + 24, 230, 7, { fill: C.card, stroke: C.ink2 })); d.mono(470, 250, 'b=1; Domain=wren.example: all three', { size: 9 });
  d.text(320, 300, 'Path=/orders limits by path, but it is not a security boundary', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_lifetime() {
  const d = fig('be_cookie_lifetime', 'SESSION COOKIES END WITH THE BROWSER; PERSISTENT ONES END AT Max-Age', 290);
  const X = (t) => 160 + t * 14;
  d.arrow(150, 220, 620, 220, { stroke: C.gray });
  cookie(d, 60, 100, 14, { fill: C.card, stroke: C.ink2 }); d.text(110, 104, 'no Expires', { cls: 'sm', a: 'start' }); d.rect(X(0), 90, X(12) - X(0), 26, { r: 3, fill: C.card, stroke: C.ink2 }); browser(d, X(12) + 6, 84, 50, 36, ''); cross(d, X(12) + 31, 110, 6, C.ink2); d.text(X(12) + 64, 104, 'browser closed', { cls: 'xs', a: 'start' });
  cookie(d, 60, 160, 14); d.text(110, 164, 'Max-Age=1800', { cls: 'sm', a: 'start', color: C.acc }); d.rect(X(0), 150, X(30) - X(0), 26, { r: 3, fill: C.accSoft, stroke: C.acc }); hourglass(d, X(30) + 14, 146, 34, { level: 1 });
  [0, 10, 20, 30].forEach((t) => d.mono(X(t), 236, `${t} min`, { size: 9 }));
  d.text(320, 270, 'Max-Age wins over Expires; Max-Age=0 deletes the cookie now', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_flags() {
  const d = fig('be_cookie_flags', 'Secure KEEPS A COOKIE OFF PLAIN HTTP; HttpOnly KEEPS IT AWAY FROM SCRIPTS', 310);
  panel(d, 20, 40, 290, 240, 'Secure');
  d.mono(110, 90, 'http://', { size: 10 }); pipe(d, 150, 270, 90, 14); cross(d, 210, 90, 9); cookie(d, 60, 90, 12);
  d.mono(110, 170, 'https://', { size: 10 }); pipe(d, 150, 270, 170, 14, true); d.lock(202, 154, 16, { stroke: C.acc }); cookie(d, 60, 170, 12);
  d.travel([[150, 170], [270, 170]], { token: (dd) => cookie(dd, 0, 0, 6) });
  d.text(165, 240, 'never sent over plain HTTP', { cls: 'xs' });
  panel(d, 330, 40, 290, 240, 'HttpOnly', true);
  d.mono(475, 90, 'document.cookie  →  ""', { size: 10, color: C.acc }); cookie(d, 430, 150, 18); d.rect(400, 120, 60, 60, { r: 4, fill: 'none', stroke: C.acc, sw: 1.6 });
  d.text(530, 140, 'XSS cannot read it', { cls: 'xs' }); d.text(530, 158, 'or send it away', { cls: 'xs' });
  d.text(475, 240, 'it can still make requests that carry it', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_prefix() {
  const d = fig('be_cookie_prefix', 'COOKIE PREFIXES ARE RULES THE BROWSER ENFORCES ON THE NAME', 300);
  cookie(d, 90, 110, 30, { fill: C.card, stroke: C.ink2 }); d.mono(90, 170, '__Secure-sid', { size: 10 });
  ['must have Secure', 'must be set over HTTPS'].forEach((s, i) => { tick(d, 150, 90 + i * 26, 6, C.ink2); d.text(164, 90 + i * 26, s, { cls: 'sm', a: 'start' }); });
  cookie(d, 380, 110, 30); d.mono(380, 170, '__Host-sid', { size: 10, color: C.acc });
  ['must have Secure', 'must have Path=/', 'must NOT have Domain'].forEach((s, i) => { tick(d, 440, 80 + i * 26, 6); d.text(454, 80 + i * 26, s, { cls: 'sm', a: 'start' }); });
  house(d, 500, 190, 50, 'blog.wren', { stroke: C.gray }); cross(d, 570, 215, 8); d.text(470, 270, 'a sibling subdomain cannot set or overwrite it', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_cookie_third_party() {
  const d = fig('be_cookie_third_party', 'A THIRD-PARTY COOKIE BELONGS TO AN EMBED, NOT TO THE SITE IN THE ADDRESS BAR', 300);
  browser(d, 20, 50, 270, 200, 'https://news.example');
  d.rect(110, 120, 140, 70, { r: 5, fill: C.accSoft, stroke: C.acc }); d.mono(180, 155, 'tracker.example', { size: 9.5 });
  browser(d, 350, 50, 270, 200, 'https://shop.example');
  d.rect(440, 120, 140, 70, { r: 5, fill: C.accSoft, stroke: C.acc }); d.mono(510, 155, 'tracker.example', { size: 9.5 });
  d.hand(320, 280, 'same cookie, two sites: tracking');
  return d.svg();
}

export function be_samesite_matrix() {
  const d = fig('be_samesite_matrix', 'WHICH CROSS-SITE REQUESTS CARRY THE COOKIE, BY SameSite VALUE', 310);
  const cols = ['Strict', 'Lax', 'None; Secure'], rows = ['link click (top-level GET)', 'form POST from evil.example', 'fetch, img, iframe from evil'];
  const v = [[0, 1, 1], [0, 0, 1], [0, 0, 1]];
  cols.forEach((c, j) => d.text(340 + j * 100, 60, c, { cls: 'ttl', size: 11 }));
  house(d, 30, 90, 50, 'evil', { stroke: C.gray });
  rows.forEach((r, i) => { const y = 80 + i * 56; d.text(280, y + 15, r, { cls: 'sm', a: 'end' }); v[i].forEach((x, j) => { const cx = 340 + j * 100; if (x) cookie(d, cx, y + 15, 11, j === 2 ? {} : { fill: C.card, stroke: C.ink2 }); else { d.circle(cx, y + 15, 22, { stroke: C.line, dash: [3, 3] }); } }); });
  d.text(320, 270, 'same-site requests always carry it; "site" ignores subdomains', { cls: 'xs' });
  return d.svg();
}

export function be_samesite_gaps() {
  const d = fig('be_samesite_gaps', 'WHERE SameSite=Lax STILL LETS A FORGED REQUEST THROUGH', 320);
  panel(d, 20, 40, 190, 250, 'GET that writes');
  browser(d, 40, 80, 150, 60, ''); d.mono(115, 91, '/cancel?id=7', { size: 8.5, color: C.acc }); cookie(d, 115, 170, 12); d.text(115, 220, 'top-level navigation', { cls: 'xs' }); d.text(115, 236, 'carries Lax cookies', { cls: 'xs' });
  panel(d, 225, 40, 190, 250, 'sibling subdomain', true);
  house(d, 255, 90, 50, 'blog'); house(d, 335, 90, 50, 'api', { fill: C.accSoft, stroke: C.acc }); d.arrow(308, 120, 334, 120, { stroke: C.acc, hl: 5 }); d.text(320, 220, 'same site as api:', { cls: 'xs' }); d.text(320, 236, 'SameSite does not apply', { cls: 'xs' });
  panel(d, 430, 40, 190, 250, 'browser exceptions');
  d.clock(525, 130, 60, { t: 0.08 }); d.text(525, 200, 'older browsers ignore it;', { cls: 'xs' }); d.text(525, 216, 'Chrome once allowed POST', { cls: 'xs' }); d.text(525, 232, 'in the first 2 minutes', { cls: 'xs' });
  d.text(320, 310, 'SameSite reduces CSRF; it does not replace a token or an Origin check', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_attack() {
  const d = fig('be_csrf_attack', 'CSRF: THE VICTIM\'S BROWSER SUBMITS THE ATTACKER\'S FORM WITH THE VICTIM\'S COOKIE', 330);
  browser(d, 20, 50, 260, 170, 'https://evil.example/prize');
  card(d, 36, 90, 228, ['<form method=POST', ' action=api.wren.example/', '  account/email>', '<input email=me@evil>', '<script>submit()'], { size: 8.5, lh: 15, hot: [3] });
  d.server(480, 70, 90, 120, { label: 'api.wren.example' });
  d.arrow(286, 130, 470, 130, { stroke: C.acc, sw: 1.5 });
  d.mono(378, 118, 'Cookie: sid (auto)', { size: 9, color: C.acc });
  d.text(525, 230, 'valid session,\nemail changed', { cls: 'sm', vc: true, color: C.acc });
  d.text(320, 290, 'the attacker never sees the cookie; the browser attaches it for them', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_synchronizer() {
  const d = fig('be_csrf_synchronizer', 'SYNCHRONIZER TOKEN: A SECRET IN THE PAGE THAT A FOREIGN PAGE CANNOT READ', 300);
  d.db(30, 70, 110, 90, { label: 'session\nstore' }); d.mono(85, 180, 'sid 8f2c -> csrf a91e', { size: 9 });
  browser(d, 210, 50, 230, 150, 'https://app.wren.example');
  d.mono(325, 110, '<input type=hidden', { size: 9 }); d.mono(325, 126, ' csrf=a91e>', { size: 9, color: C.acc });
  d.server(520, 70, 80, 110, { label: 'API' });
  d.arrow(446, 120, 512, 120, { stroke: C.acc }); d.text(480, 108, 'POST + a91e', { cls: 'xs' });
  d.text(320, 250, 'server compares the posted token with the session; evil.example cannot read the page to copy it', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_double_submit() {
  const d = fig('be_csrf_double_submit', 'SIGNED DOUBLE SUBMIT: SAME VALUE IN A COOKIE AND A HEADER, BOUND TO THE SESSION', 320);
  d.envelope(30, 60, 260, 150, {}); cookie(d, 80, 170, 18); d.mono(110, 170, '__Host-csrf=a91e.sig', { a: 'start', size: 9 }); d.rect(60, 120, 200, 22, { r: 3, fill: C.accSoft, stroke: C.acc }); d.mono(160, 131, 'X-CSRF-Token: a91e.sig', { size: 9, color: C.acc });
  d.server(350, 70, 70, 100, {}); d.arrow(294, 130, 346, 120, { stroke: C.ink2, hl: 5 });
  ['header == cookie', 'HMAC(key, sid + a91e) == sig', 'no server-side storage'].forEach((s, i) => { tick(d, 440, 90 + i * 26, 6); d.text(454, 90 + i * 26, s, { cls: 'sm', a: 'start' }); });
  d.text(320, 250, 'evil.example can make the browser send the cookie, but cannot read it to copy into the header', { cls: 'xs' });
  d.text(320, 272, 'unsigned double submit fails if a sibling subdomain can plant the cookie', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_origin_check() {
  const d = fig('be_csrf_origin_check', 'ORIGIN VERIFICATION: REJECT STATE-CHANGING REQUESTS FROM ORIGINS YOU DO NOT KNOW', 320);
  d.person(320, 60, 50); d.doc(350, 80, 40, 50, { fill: C.paper }); d.text(370, 144, 'allowlist', { cls: 'xs' });
  d.envelope(60, 80, 140, 60, {}); d.mono(130, 160, 'Origin: evil.example', { size: 9, color: C.acc }); d.arrow(204, 110, 290, 100, { stroke: C.acc, hl: 5 });
  d.envelope(440, 80, 140, 60, {}); d.mono(510, 160, 'Origin: app.wren.example', { size: 9 }); d.arrow(436, 110, 352, 100, { stroke: C.gray, hl: 5 });
  stamp(d, 80, 190, '403', { w: 100 }); stamp(d, 460, 190, 'PROCEED', { w: 100, stroke: C.ink2 });
  d.text(320, 250, 'for POST, PUT, PATCH, DELETE: read Origin, or Referer if absent, and match exactly', { cls: 'xs' });
  d.text(320, 272, 'both headers missing on a cookie-authenticated POST: reject unless you have a reason', { cls: 'xs' });
  return d.svg();
}

export function be_fetch_metadata() {
  const d = fig('be_fetch_metadata', 'A RESOURCE ISOLATION POLICY BUILT ON Sec-Fetch-Site', 330);
  const r = [['same-origin', 'allow'], ['same-site', 'allow if subdomains are trusted'], ['none', 'allow: typed URL, bookmark'], ['cross-site + navigate + GET', 'allow: links into the app'], ['cross-site, anything else', 'reject 403']];
  r.forEach(([a, b], i) => { const y = 56 + i * 50, hot = i === 4; d.envelope(40, y, 40, 26, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); d.mono(96, y + 13, a, { size: 9.5, a: 'start' }); d.arrow(320, y + 13, 360, y + 13, { stroke: hot ? C.acc : C.gray, hl: 5 }); (hot ? cross : tick)(d, 380, y + 13, 7, hot ? C.acc : C.ink2); d.text(400, y + 13, b, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); });
  d.text(320, 312, 'header absent: old browser or non-browser client; fall back to the other checks', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_jwt_cookie() {
  const d = fig('be_csrf_jwt_cookie', 'WHERE THE TOKEN LIVES DECIDES WHICH ATTACK YOU MUST DEFEND', 320);
  panel(d, 20, 40, 290, 250, 'JWT in a cookie', true);
  cookie(d, 90, 110, 22); d.mono(200, 110, 'jwt=eyJ…', { size: 10 }); d.text(165, 170, 'the browser attaches it automatically', { cls: 'xs' });
  d.text(165, 220, 'CSRF possible: needs SameSite', { cls: 'xs', color: C.acc }); d.text(165, 236, 'plus a token or Origin check', { cls: 'xs', color: C.acc });
  panel(d, 330, 40, 290, 250, 'JWT in Authorization header');
  d.key(390, 110, 50); d.mono(510, 110, 'Bearer eyJ…', { size: 10 }); d.text(475, 170, 'the script must add it explicitly', { cls: 'xs' });
  d.text(475, 220, 'no CSRF, but it sits in JS memory', { cls: 'xs' }); d.text(475, 236, 'where XSS can steal it', { cls: 'xs' });
  return d.svg();
}

export function be_browser_trace() {
  const d = fig('be_browser_trace', 'app.wren.example CHANGES AN ORDER ON api.wren.example: EVERY CHECK IN ORDER', 400);
  const xs = actors(d, ['app page', 'browser', 'api.wren.example'], 44, 380, { x0: 90, x1: 550, hot: 2 });
  say(d, xs[0], xs[1], 96, 'fetch PATCH /orders/123, credentials: include');
  say(d, xs[1], xs[2], 136, 'OPTIONS preflight (no cookie)');
  say(d, xs[2], xs[1], 170, '204 + exact ACAO + ACAC + Max-Age 600');
  say(d, xs[1], xs[2], 214, 'PATCH + Cookie __Host-sid + X-CSRF-Token + Origin', { hot: true, size: 8.5 });
  d.rect(xs[2] - 60, 228, 120, 74, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.text(xs[2], 265, 'session valid?\nOrigin allowed?\ntoken matches?\nowner of 123?', { cls: 'xs', vc: true });
  say(d, xs[2], xs[1], 330, '200 + ACAO + Vary: Origin');
  say(d, xs[1], xs[0], 360, 'body readable');
  return d.svg();
}

export function be_browser_config() {
  const d = fig('be_browser_config', 'WREN\'S BROWSER-FACING CONFIGURATION ON ONE CARD', 360);
  d.rect(20, 40, 600, 300, { r: 10, fill: C.paper, stroke: C.ink2 });
  const L = [['cookie', '__Host-sid=<128 random bits>; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=1800'], ['cookie', '__Host-csrf=<token>.<hmac>; Secure; SameSite=Strict; Path=/'], ['house', 'CORS allowlist: app.wren.example, partner.example'], ['key', 'Allow-Credentials: true (app only) · Max-Age: 600'], ['doc', 'Vary: Origin on every response that may carry CORS headers'], ['shield', 'unsafe methods: allowed Origin + matching X-CSRF-Token'], ['env', 'Sec-Fetch-Site: reject cross-site non-navigation'], ['lock', 'Strict-Transport-Security: max-age=31536000; includeSubDomains']];
  L.forEach(([k, s], i) => { const y = 68 + i * 34, x = 46; if (k === 'cookie') cookie(d, x, y, 9, i ? { fill: C.card, stroke: C.ink2 } : {}); if (k === 'house') house(d, x - 12, y - 12, 24, ''); if (k === 'key') d.key(x - 12, y, 24); if (k === 'doc') d.doc(x - 9, y - 12, 18, 24, {}); if (k === 'shield') shield(d, x, y - 12, 22, {}); if (k === 'env') d.envelope(x - 12, y - 8, 24, 16, {}); if (k === 'lock') d.lock(x - 9, y - 10, 18); d.mono(70, y, s, { a: 'start', size: 9, color: i === 0 ? C.acc : undefined }); });
  return d.svg();
}

export function be_browser_defences() {
  const d = fig('be_browser_defences', 'WHICH DEFENCE STOPS WHICH ATTACK', 340);
  const cols = ['SOP', 'CORS', 'SameSite', 'CSRF token', 'HttpOnly'];
  const rows = [['read victim data cross-site', [1, 0, 1, 0, 0]], ['forged cross-site POST', [0, 0, 1, 1, 0]], ['XSS steals session id', [0, 0, 0, 0, 1]], ['curl with stolen cookie', [0, 0, 0, 0, 0]]];
  cols.forEach((c, j) => { shield(d, 300 + j * 66, 40, 26, {}); d.text(300 + j * 66, 82, c, { cls: 'xs' }); });
  rows.forEach(([r, v], i) => { const y = 96 + i * 50; d.text(250, y + 15, r, { cls: 'sm', a: 'end' }); v.forEach((x, j) => { const cx = 300 + j * 66; if (x) { d.circle(cx, y + 15, 26, { fill: C.accSoft, stroke: C.acc }); tick(d, cx, y + 15, 6); } else d.circle(cx, y + 15, 10, { stroke: C.line }); }); });
  d.text(320, 316, 'CORS opens reads; it never blocks what the SOP allowed. The last row needs session controls', { cls: 'xs' });
  return d.svg();
}

import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser } from '../lib/be-kit.js';

const PARTS = ['Origins and the same-origin policy', 'CORS: simple and preflight requests', 'CORS credentials and caching', 'CORS vulnerabilities', 'Cookies', 'SameSite and third-party cookies', 'CSRF', 'The browser boundary end to end'];
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
  const d = fig('be_origin_parts', 'AN ORIGIN IS THREE PARTS OF THE URL; THE PATH IS NOT ONE OF THEM', 240);
  d.chips(40, 80, ['https', '://', 'app.wren.example', ':443', '/orders/123?x=1'], { h: 34, size: 12, fill: (i) => ([0, 2, 3].includes(i) ? C.accSoft : C.card), stroke: (i) => ([0, 2, 3].includes(i) ? C.acc : C.line) });
  d.text(70, 136, 'scheme', { cls: 'sm', color: C.acc }); d.text(220, 136, 'host', { cls: 'sm', color: C.acc }); d.text(330, 136, 'port', { cls: 'sm', color: C.acc }); d.text(470, 136, 'path and query: ignored', { cls: 'sm' });
  d.text(320, 196, 'the default port is implied: https://app.wren.example means port 443', { cls: 'xs' });
  return d.svg();
}

export function be_origin_table() {
  const d = fig('be_origin_table', 'COMPARED WITH https://app.wren.example: SAME ORIGIN? SAME SITE?', 330);
  const rows = [['https://app.wren.example/menu', 1, 1], ['http://app.wren.example', 0, 0], ['https://app.wren.example:8443', 0, 1], ['https://api.wren.example', 0, 1], ['https://wren.example', 0, 1], ['https://evil.example', 0, 0]];
  d.text(420, 52, 'same origin', { cls: 'ttl' }); d.text(540, 52, 'same site', { cls: 'ttl' });
  rows.forEach(([u, o, s], i) => {
    const y = 70 + i * 40;
    d.mono(30, y + 13, u, { a: 'start', size: 10 });
    [o, s].forEach((v, j) => { const x = 380 + j * 120; d.rect(x, y, 80, 26, { r: 4, fill: v ? C.accSoft : C.paper, stroke: v ? C.acc : C.line }); if (v) tick(d, x + 40, y + 13, 7); else d.text(x + 40, y + 13, 'no', { cls: 'xs' }); });
  });
  d.text(320, 316, 'site = scheme + registrable domain (wren.example); origin adds the exact host and port', { cls: 'xs' });
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
  const d = fig('be_fetch_headers', 'THE BROWSER TELLS THE SERVER WHERE A REQUEST CAME FROM, AND SCRIPTS CANNOT FORGE IT', 300);
  card(d, 20, 50, 350, ['POST /orders HTTP/2', 'Host: api.wren.example', 'Origin: https://evil.example', 'Referer: https://evil.example/win', 'Sec-Fetch-Site: cross-site', 'Sec-Fetch-Mode: navigate', 'Sec-Fetch-Dest: document', 'Cookie: __Host-sid=8f2c...'], { hot: [2, 4], lh: 26 });
  d.text(500, 90, 'Origin: who started it\n(scheme, host, port only)', { cls: 'xs', vc: true });
  d.text(500, 150, 'Sec-Fetch-Site:\nsame-origin, same-site,\ncross-site or none', { cls: 'xs', vc: true });
  d.text(500, 220, 'curl can set all of these;\na browser page cannot', { cls: 'xs', vc: true });
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
  const q = [['method is GET, HEAD or POST?', 60], ['only safelisted headers?', 130], ['Content-Type is form, multipart\nor text/plain?', 200]];
  q.forEach(([s, y]) => { d.rect(60, y, 240, 46, { r: 7, fill: C.card, stroke: C.ink2 }); d.text(180, y + 23, s, { cls: 'sm', vc: true }); d.arrow(304, y + 23, 400, y + 23, { stroke: C.acc, hl: 5 }); d.text(352, y + 12, 'no', { cls: 'xs', color: C.acc }); if (y < 200) { d.arrow(180, y + 50, 180, y + 66, { stroke: C.gray, hl: 5 }); d.text(196, y + 58, 'yes', { cls: 'xs', a: 'start' }); } });
  d.rect(410, 100, 190, 60, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(505, 130, 'preflight (OPTIONS)', { cls: 'ttl', color: C.acc });
  d.arrow(180, 250, 180, 280, { stroke: C.gray, hl: 5 }); d.text(180, 296, 'simple request, no preflight', { cls: 'sm' });
  d.text(500, 210, 'JSON bodies and Authorization\nheaders always trigger it', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cors_headers() {
  const d = fig('be_cors_headers', 'THE SIX CORS RESPONSE HEADERS AND WHAT EACH ONE UNLOCKS', 300);
  card(d, 20, 50, 380, ['HTTP/2 204', 'Access-Control-Allow-Origin: https://app.wren.example', 'Access-Control-Allow-Methods: GET, PUT, DELETE', 'Access-Control-Allow-Headers: content-type, x-request-id', 'Access-Control-Allow-Credentials: true', 'Access-Control-Expose-Headers: x-request-id', 'Access-Control-Max-Age: 600'], { hot: [1], lh: 28, size: 9.5 });
  ['who may read', 'methods allowed (preflight)', 'request headers allowed', 'cookies may be sent and read', 'response headers scripts can see', 'seconds to cache the preflight'].forEach((s, i) => d.text(420, 92 + i * 28, s, { cls: 'xs', a: 'start' }));
  return d.svg();
}

export function be_cors_credentials() {
  const d = fig('be_cors_credentials', 'WITH CREDENTIALS, THE WILDCARD IS REFUSED: NAME THE ORIGIN', 280);
  panel(d, 20, 40, 290, 210, 'rejected by the browser');
  card(d, 40, 80, 250, ['ACAO: *', 'ACAC: true'], { hot: [0] }); cross(d, 165, 170, 12);
  d.text(165, 215, 'any site could read a logged-in\nuser\'s data', { cls: 'xs', vc: true });
  panel(d, 330, 40, 290, 210, 'accepted', true);
  card(d, 350, 80, 250, ['ACAO: https://app.wren.example', 'ACAC: true', 'Vary: Origin'], { hot: [0, 2] }); tick(d, 475, 180, 12);
  return d.svg();
}

export function be_cors_allowlist() {
  const d = fig('be_cors_allowlist', 'SAFE DYNAMIC CORS: EXACT STRING MATCH AGAINST A SET', 290);
  d.mono(30, 70, 'Origin: https://partner.example', { a: 'start', size: 10, color: C.acc });
  d.mono(30, 110, 'Origin: https://evil.example', { a: 'start', size: 10 });
  d.rect(270, 50, 150, 110, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(345, 68, 'ALLOWED set', { cls: 'ttl', size: 11 });
  ['https://app.wren.example', 'https://partner.example'].forEach((s, i) => d.mono(345, 96 + i * 22, s, { size: 8.5, color: i ? C.acc : undefined }));
  d.arrow(232, 70, 264, 90, { stroke: C.acc, hl: 5 }); d.arrow(210, 110, 264, 125, { stroke: C.gray, hl: 5 });
  d.text(530, 80, 'echo it back\n+ Vary: Origin', { cls: 'sm', vc: true, color: C.acc }); d.arrow(424, 90, 470, 80, { stroke: C.acc, hl: 5 });
  d.text(530, 140, 'no CORS headers', { cls: 'sm' }); d.arrow(424, 130, 470, 140, { stroke: C.gray, hl: 5 });
  d.text(320, 240, 'parse the origin, compare whole strings; never use startswith, endswith or an unanchored regex', { cls: 'xs' });
  return d.svg();
}

export function be_cors_vary() {
  const d = fig('be_cors_vary', 'WITHOUT Vary: Origin, A CACHE SERVES ONE ORIGIN\'S CORS ANSWER TO ANOTHER', 300);
  d.rect(250, 90, 140, 110, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(320, 110, 'CDN cache', { cls: 'ttl' }); d.mono(320, 140, '/menu', { size: 10 }); d.mono(320, 162, 'ACAO: partner', { size: 9, color: C.acc });
  say(d, 40, 244, 80, 'Origin: partner (first)'); say(d, 40, 244, 220, 'Origin: app.wren (second)');
  d.arrow(394, 150, 540, 220, { stroke: C.acc }); d.text(520, 250, 'app.wren gets ACAO: partner,\nbrowser blocks it', { cls: 'xs', vc: true });
  d.text(520, 110, 'with Vary: Origin,\none entry per origin', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cors_maxage() {
  const d = fig('be_cors_maxage', '120 PUTS IN 10 MINUTES: PREFLIGHT CACHING HALVES THE REQUESTS', 230);
  hbars(d, [['no Max-Age', 240, '240 HTTP requests'], ['Max-Age: 600', 121, '121 HTTP requests', true]], { y: 70, gap: 54, w: 330 });
  d.text(320, 200, 'Chromium caps Max-Age at 7,200 s; the cache is per origin, URL and request shape', { cls: 'xs' });
  return d.svg();
}

export function be_cors_null() {
  const d = fig('be_cors_null', 'MANY UNRELATED CONTEXTS SEND Origin: null', 270);
  [['sandboxed iframe', 60], ['file:// page', 220], ['some redirects', 380], ['data: URL', 540]].forEach(([s, x], i) => { d.rect(x - 65, 70, 130, 60, { r: 7, fill: C.card, stroke: C.ink2 }); d.text(x, 100, s, { cls: 'sm' }); d.arrow(x, 134, 320, 180, { stroke: C.gray, hl: 5 }); });
  d.mono(320, 196, 'Origin: null', { size: 12, color: C.acc });
  d.text(320, 240, 'an attacker can produce it on purpose; never put "null" in the allowlist', { cls: 'xs' });
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
  const d = fig('be_cors_regex', 'CHECKS THAT LOOK RIGHT AND ARE NOT', 300);
  const rows = [['endswith("wren.example")', 'https://evilwren.example', true], ['startswith("https://app.wren.example")', 'https://app.wren.example.evil.com', true], ['regex app.wren.example (dot unescaped)', 'https://appXwren.example', true], ['regex ^https://app\\.wren\\.example$', 'https://app.wren.example', false]];
  rows.forEach(([chk, o, bad], i) => { const y = 54 + i * 56; d.mono(30, y, chk, { a: 'start', size: 9.5 }); d.mono(30, y + 20, `passes: ${o}`, { a: 'start', size: 9.5, color: bad ? C.acc : undefined }); if (bad) cross(d, 600, y + 10, 8); else tick(d, 600, y + 10, 8); });
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
  const d = fig('be_cors_not_auth', 'CORS IS ENFORCED BY BROWSERS ONLY, AND ONLY ON READS', 300);
  panel(d, 20, 40, 290, 230, 'curl or a server');
  d.mono(165, 100, 'curl -H "Origin: x"', { size: 10 }); d.mono(165, 120, 'api.wren.example/me', { size: 10 });
  d.text(165, 170, 'no browser, no CORS check;\nauthentication is what stops it', { cls: 'xs', vc: true });
  panel(d, 330, 40, 290, 230, 'a cross-site form POST', true);
  d.text(475, 100, 'browser sends it with cookies', { cls: 'sm' }); d.text(475, 125, 'server runs it', { cls: 'sm', color: C.acc });
  d.text(475, 170, 'the response is hidden,\nbut the order was placed', { cls: 'xs', vc: true });
  d.text(475, 230, 'that is CSRF, not a CORS problem', { cls: 'xs' });
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
  d.rect(240, 50, 160, 36, { r: 6, fill: C.card, stroke: C.ink2 }); d.mono(320, 68, 'wren.example', { size: 11 });
  [['app.wren.example', 100], ['api.wren.example', 320], ['blog.wren.example', 540]].forEach(([s, x], i) => { d.line(320, 86, x, 130, { stroke: C.line, single: true }); d.rect(x - 85, 130, 170, 34, { r: 6, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.mono(x, 147, s, { size: 10 }); });
  card(d, 20, 200, 290, ['Set-Cookie: a=1', '(host-only: api.wren.example only)'], { hot: [1] });
  card(d, 330, 200, 290, ['Set-Cookie: b=1; Domain=wren.example', '(all three subdomains get it)'], {});
  d.text(320, 300, 'Path=/orders limits by path, but it is not a security boundary', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_lifetime() {
  const d = fig('be_cookie_lifetime', 'SESSION COOKIES END WITH THE BROWSER; PERSISTENT ONES END AT Max-Age', 250);
  const X = (t) => 140 + t * 14;
  d.arrow(130, 190, 620, 190, { stroke: C.gray });
  d.text(120, 90, 'no Expires', { cls: 'sm', a: 'end' }); d.rect(X(0), 76, X(12) - X(0), 26, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X(12) + 8, 89, 'browser closed', { cls: 'xs', a: 'start' });
  d.text(120, 140, 'Max-Age=1800', { cls: 'sm', a: 'end' }); d.rect(X(0), 126, X(30) - X(0), 26, { r: 3, fill: C.accSoft, stroke: C.acc });
  [0, 10, 20, 30].forEach((t) => d.mono(X(t), 206, `${t} min`, { size: 9 }));
  d.text(320, 236, 'Max-Age wins over Expires; Max-Age=0 deletes the cookie now', { cls: 'xs' });
  return d.svg();
}

export function be_cookie_flags() {
  const d = fig('be_cookie_flags', 'Secure KEEPS A COOKIE OFF PLAIN HTTP; HttpOnly KEEPS IT AWAY FROM SCRIPTS', 290);
  panel(d, 20, 40, 290, 220, 'Secure');
  d.mono(165, 90, 'http://api.wren.example', { size: 9.5 }); cross(d, 165, 120, 9); d.text(165, 150, 'cookie not sent', { cls: 'sm' });
  d.mono(165, 190, 'https://api.wren.example', { size: 9.5 }); tick(d, 165, 215, 9);
  panel(d, 330, 40, 290, 220, 'HttpOnly', true);
  d.mono(475, 90, 'document.cookie', { size: 10 }); d.mono(475, 112, '-> "" (sid hidden)', { size: 10, color: C.acc });
  d.text(475, 170, 'an XSS payload cannot read\nand exfiltrate the session id', { cls: 'xs', vc: true });
  d.text(475, 220, 'it can still make requests\nthat carry it', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cookie_prefix() {
  const d = fig('be_cookie_prefix', 'COOKIE PREFIXES ARE RULES THE BROWSER ENFORCES ON THE NAME', 260);
  card(d, 20, 50, 290, ['__Secure-sid=...', 'must have Secure', 'must be set over HTTPS'], { hot: [0] });
  card(d, 330, 50, 290, ['__Host-sid=...', 'must have Secure', 'must have Path=/', 'must NOT have Domain'], { hot: [0, 3] });
  d.text(475, 180, 'cannot be set or overwritten by\na sibling subdomain', { cls: 'xs', vc: true, color: C.acc });
  d.text(165, 180, 'blocks setting it over plain HTTP', { cls: 'xs' });
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
  const d = fig('be_samesite_matrix', 'WHICH CROSS-SITE REQUESTS CARRY THE COOKIE, BY SameSite VALUE', 290);
  const cols = ['Strict', 'Lax', 'None; Secure'], rows = ['link click (top-level GET)', 'form POST from evil.example', 'fetch, img, iframe from evil'];
  const v = [[0, 1, 1], [0, 0, 1], [0, 0, 1]];
  cols.forEach((c, j) => d.text(330 + j * 100, 60, c, { cls: 'ttl', size: 11 }));
  rows.forEach((r, i) => { const y = 80 + i * 50; d.text(260, y + 15, r, { cls: 'sm', a: 'end' }); v[i].forEach((x, j) => { const cx = 330 + j * 100; d.rect(cx - 40, y, 80, 30, { r: 4, fill: x ? (j === 2 ? C.accSoft : C.card) : C.paper, stroke: x ? (j === 2 ? C.acc : C.ink2) : C.line }); d.text(cx, y + 15, x ? 'sent' : 'not sent', { cls: 'xs' }); }); });
  d.text(320, 256, 'same-site requests always carry it; "site" ignores subdomains', { cls: 'xs' });
  return d.svg();
}

export function be_samesite_gaps() {
  const d = fig('be_samesite_gaps', 'WHERE SameSite=Lax STILL LETS A FORGED REQUEST THROUGH', 300);
  panel(d, 20, 40, 190, 230, 'GET that writes');
  d.mono(115, 100, 'GET /cancel?id=7', { size: 9.5 }); d.text(115, 150, 'top-level navigation\ncarries Lax cookies', { cls: 'xs', vc: true });
  panel(d, 225, 40, 190, 230, 'sibling subdomain', true);
  d.mono(320, 100, 'blog.wren.example', { size: 9.5 }); d.text(320, 150, 'same site as api:\nSameSite does not apply', { cls: 'xs', vc: true });
  panel(d, 430, 40, 190, 230, 'browser exceptions');
  d.text(525, 110, 'older browsers ignore it;\nChrome once allowed POST\nin the first 2 minutes', { cls: 'xs', vc: true });
  d.text(320, 250, 'SameSite reduces CSRF; it does not replace a token or an Origin check', { cls: 'xs' });
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
  const d = fig('be_csrf_double_submit', 'SIGNED DOUBLE SUBMIT: SAME VALUE IN A COOKIE AND A HEADER, BOUND TO THE SESSION', 300);
  card(d, 20, 60, 300, ['POST /orders', 'Cookie: __Host-csrf=a91e.sig', 'X-CSRF-Token: a91e.sig'], { hot: [1, 2] });
  d.rect(370, 60, 240, 120, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(490, 80, 'server checks', { cls: 'ttl', color: C.acc });
  ['header == cookie', 'HMAC(key, sid + a91e) == sig', 'no server-side storage'].forEach((s, i) => d.text(490, 110 + i * 22, s, { cls: 'sm' }));
  d.text(320, 230, 'evil.example can make the browser send the cookie, but cannot read it to copy into the header', { cls: 'xs' });
  d.text(320, 252, 'unsigned double submit fails if a sibling subdomain can plant the cookie', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_origin_check() {
  const d = fig('be_csrf_origin_check', 'ORIGIN VERIFICATION: REJECT STATE-CHANGING REQUESTS FROM ORIGINS YOU DO NOT KNOW', 300);
  steps(d, [['unsafe method?', 'POST, PUT, PATCH, DELETE'], ['read Origin', 'or Referer if absent'], ['in allowlist?', 'exact match'], ['proceed', 'or 403']], 60, 2);
  d.mono(320, 170, 'Origin: https://evil.example  ->  403', { size: 11, color: C.acc });
  d.mono(320, 195, 'Origin: https://app.wren.example  ->  proceed', { size: 11 });
  d.text(320, 250, 'missing both headers on a cookie-authenticated POST: reject unless you have a reason', { cls: 'xs' });
  return d.svg();
}

export function be_fetch_metadata() {
  const d = fig('be_fetch_metadata', 'A RESOURCE ISOLATION POLICY BUILT ON Sec-Fetch-Site', 320);
  const r = [['same-origin', 'allow', false], ['same-site', 'allow (if subdomains trusted)', false], ['none', 'allow (typed URL, bookmark)', false], ['cross-site + navigate + GET', 'allow (links into the app)', false], ['cross-site, anything else', 'reject 403', true]];
  r.forEach(([a, b, hot], i) => { const y = 54 + i * 48; d.rect(40, y, 250, 34, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(165, y + 17, a, { size: 10 }); d.arrow(294, y + 17, 350, y + 17, { stroke: hot ? C.acc : C.gray, hl: 5 }); d.text(360, y + 17, b, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); });
  d.text(320, 304, 'header absent: old browser or non-browser client; fall back to the other checks', { cls: 'xs' });
  return d.svg();
}

export function be_csrf_jwt_cookie() {
  const d = fig('be_csrf_jwt_cookie', 'WHERE THE TOKEN LIVES DECIDES WHICH ATTACK YOU MUST DEFEND', 300);
  panel(d, 20, 40, 290, 230, 'JWT in a cookie', true);
  d.mono(165, 90, 'Cookie: jwt=eyJ...', { size: 10 }); d.text(165, 130, 'browser attaches it\nautomatically', { cls: 'sm', vc: true });
  d.text(165, 190, 'CSRF possible: needs\nSameSite + token or Origin check', { cls: 'xs', vc: true, color: C.acc });
  panel(d, 330, 40, 290, 230, 'JWT in Authorization header');
  d.mono(475, 90, 'Authorization: Bearer eyJ...', { size: 9.5 }); d.text(475, 130, 'script must add it\nexplicitly', { cls: 'sm', vc: true });
  d.text(475, 190, 'no CSRF, but the token sits in\nJS memory where XSS can steal it', { cls: 'xs', vc: true });
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
  const d = fig('be_browser_config', 'WREN\'S BROWSER-FACING CONFIGURATION ON ONE CARD', 340);
  card(d, 20, 50, 600, ['Set-Cookie: __Host-sid=<random 128 bits>; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=1800', 'Set-Cookie: __Host-csrf=<token>.<hmac>; Secure; SameSite=Strict; Path=/', 'CORS allowlist: https://app.wren.example, https://partner.example', 'Access-Control-Allow-Credentials: true (app only)   Access-Control-Max-Age: 600', 'Vary: Origin on every response that may carry CORS headers', 'Unsafe methods: require allowed Origin + matching X-CSRF-Token', 'Sec-Fetch-Site: reject cross-site non-navigation requests', 'Strict-Transport-Security: max-age=31536000; includeSubDomains'], { lh: 32, size: 9, hot: [0] });
  return d.svg();
}

export function be_browser_defences() {
  const d = fig('be_browser_defences', 'WHICH DEFENCE STOPS WHICH ATTACK', 330);
  const cols = ['SOP', 'CORS', 'SameSite', 'CSRF token', 'HttpOnly'];
  const rows = [['read victim data cross-site', [1, 0, 1, 0, 0]], ['forged cross-site POST', [0, 0, 1, 1, 0]], ['XSS steals session id', [0, 0, 0, 0, 1]], ['curl with stolen cookie', [0, 0, 0, 0, 0]]];
  cols.forEach((c, j) => d.text(300 + j * 66, 56, c, { cls: 'ttl', size: 10 }));
  rows.forEach(([r, v], i) => { const y = 74 + i * 50; d.text(250, y + 15, r, { cls: 'sm', a: 'end' }); v.forEach((x, j) => { const cx = 300 + j * 66; d.rect(cx - 28, y, 56, 30, { r: 4, fill: x ? C.accSoft : C.paper, stroke: x ? C.acc : C.line }); if (x) tick(d, cx, y + 15, 6); }); });
  d.text(320, 300, 'CORS opens reads; it never blocks anything the SOP allowed. The last row needs session controls', { cls: 'xs' });
  return d.svg();
}

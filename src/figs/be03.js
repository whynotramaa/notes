import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser, hourglass, signpost, gauge, crowd, seg, lanes, bubble } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Session authentication', 'Logout, devices and revocation', 'Password storage', 'Login attacks and defences', 'Password reset', 'JSON Web Tokens', 'Access and refresh tokens', 'JWT attacks and mistakes', 'OAuth 2.0', 'OpenID Connect and the full login'];
function tag(d, x, y, w, label, o = {}) {
  d.poly([[x, y], [x + w, y], [x + w, y + 26], [x, y + 26], [x - 12, y + 13]], { fill: o.hot ? C.accSoft : C.card, stroke: o.hot ? C.acc : C.ink2 });
  d.circle(x - 3, y + 13, 5, { fill: C.paper, stroke: C.ink2 });
  d.mono(x + w / 2, y + 13, label, { size: o.size ?? 9.5, color: o.hot ? C.acc : undefined });
}

function grinder(d, x, y, label, o = {}) {
  d.poly([[x - 30, y], [x + 30, y], [x + 18, y + 30], [x - 18, y + 30]], { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
  d.rect(x - 22, y + 30, 44, 40, { r: 3, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
  d.gear(x, y + 50, 13, { spin: o.spin, fill: C.paper });
  if (label) d.text(x, y + 84, label, { cls: 'xs' });
}

function token3(d, x, y, w, parts, o = {}) {
  const h = o.h ?? 30, cols = [C.card, C.slateSoft, C.accSoft];
  let cx = x;
  parts.forEach(([s, pw], i) => { d.rect(cx, y, pw, h, { r: 3, fill: cols[i], stroke: i === 2 ? C.acc : C.ink2 }); d.mono(cx + pw / 2, y + h / 2, s, { size: o.size ?? 9 }); cx += pw; if (i < 2) { d.dot(cx + 4, y + h / 2, 2.4, C.ink); cx += 8; } });
}

function inbox(d, x, y, o = {}) {
  d.rect(x, y, 70, 50, { r: 4, fill: C.card, stroke: o.stroke ?? C.ink2 });
  d.envelope(x + 15, y + 14, 40, 26, { fill: o.hot ? C.accSoft : C.paper, stroke: o.hot ? C.acc : C.ink2 });
}

export const where_be_auth = (stage = 99) => beMap('where_be_auth', PARTS, stage);

export const cover_be_auth = () => beCover('cover_be_auth', 'III', ['Authenti-', 'cation'], 'Sessions, passwords, JWTs and OAuth, proved and revoked', (d, y) => {
  d.person(110, y + 50, 70);
  d.key(180, y + 90, 60, { fill: C.accSoft, stroke: C.acc });
  d.doc(300, y + 30, 120, 160, { lines: false, fill: C.card });
  ['header', 'payload', 'signature'].forEach((s, i) => { d.rect(312, y + 50 + i * 42, 96, 32, { r: 4, fill: i === 2 ? C.accSoft : C.paper, stroke: i === 2 ? C.acc : C.ink2 }); d.mono(360, y + 66 + i * 42, s, { size: 10 }); });
  d.server(490, y + 50, 100, 130, { led: (i) => i === 1 });
  d.arrow(424, y + 110, 482, y + 110, { stroke: C.acc });
  d.text(320, y + 240, 'who you are, proved on every request', { cls: 'sm' });
}, [['Sessions', 'stores, expiry, rotation'], ['Passwords', 'hashing, attacks, reset'], ['JWT', 'claims, keys, refresh, attacks'], ['OAuth and OIDC', 'delegation and identity']]);

export function be_auth_session_login() {
  const d = fig('be_auth_session_login', 'SESSION LOGIN: PROVE ONCE, THEN CARRY A RANDOM ID THE SERVER CAN LOOK UP', 320);
  const xs = actors(d, ['browser', 'Wren API', 'Redis'], 44, 300, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 96, 'POST /login {email, password}');
  d.rect(xs[1] - 52, 108, 104, 30, { r: 5, fill: C.accFaint, stroke: C.acc }); d.text(xs[1], 123, 'verify hash', { cls: 'xs' });
  say(d, xs[1], xs[2], 160, 'SET sess:8f2c {user 42, exp} EX 1800');
  say(d, xs[1], xs[0], 196, 'Set-Cookie: __Host-sid=8f2c ...', { hot: true });
  say(d, xs[0], xs[1], 240, 'GET /orders, Cookie: sid=8f2c');
  say(d, xs[1], xs[2], 270, 'GET sess:8f2c -> user 42');
  return d.svg();
}

export function be_auth_session_store() {
  const d = fig('be_auth_session_store', 'ANY APP INSTANCE CAN SERVE ANY USER BECAUSE THE SESSION LIVES IN A SHARED STORE', 300);
  [0, 1, 2, 3].forEach((i) => { d.server(40 + i * 80, 70, 60, 80, { label: `app ${i + 1}` }); d.arrow(70 + i * 80, 160, 300, 215, { stroke: C.gray, hl: 5 }); });
  d.db(250, 210, 140, 70, { label: 'Redis', fill: C.accSoft, stroke: C.acc });
  d.text(510, 110, '2,000 lookups/s at peak,\none per request', { cls: 'xs', vc: true });
  d.text(510, 240, 'store down = everyone\nlogged out', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function be_auth_session_record() {
  const d = fig('be_auth_session_record', 'WHAT A SESSION RECORD HOLDS: ABOUT 200 BYTES PER ACTIVE SESSION', 300);
  d.db(30, 90, 120, 110, { label: 'Redis', size: 11 });
  d.rect(170, 50, 260, 210, { r: 4, fill: C.paper, stroke: C.ink2 });
  d.rect(170, 50, 260, 30, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(300, 65, 'sess:<sha256 of sid>', { size: 10, color: C.acc });
  ['user_id: 42', 'created_at: 10:00:00', 'last_seen: 10:12:40', 'absolute_exp: 22:00:00', 'device: iPhone, Wren 5.2', 'auth_level: password+otp'].forEach((s, i) => d.mono(186, 100 + i * 26, s, { a: 'start', size: 9.5 }));
  d.line(152, 145, 168, 145, { stroke: C.ink2, single: true });
  d.lock(470, 70, 22, { stroke: C.acc }); d.text(540, 82, 'hash the id, so a', { cls: 'xs' }); d.text(540, 98, 'leaked store can\'t be replayed', { cls: 'xs' });
  d.text(530, 180, '200,000 sessions', { cls: 'mono', size: 9.5 }); d.text(530, 198, '× 200 B = 40,000,000 B', { cls: 'mono', size: 9.5, color: C.acc });
  return d.svg();
}

export function be_auth_expiry() {
  const d = fig('be_auth_expiry', 'IDLE, SLIDING AND ABSOLUTE EXPIRY ON ONE TIMELINE', 320);
  const X = (m) => 150 + m * 0.62;
  d.arrow(140, 270, 620, 270, { stroke: C.gray }); [0, 120, 240, 360, 480, 600, 720].forEach((m) => d.mono(X(m), 286, `${m / 60} h`, { size: 9 }));
  d.person(60, 52, 28); [0, 10, 25, 50, 300, 320].forEach((m) => { d.dot(X(m), 66, 3.5, C.ink); d.line(X(m), 70, X(m), 260, { stroke: C.line, single: true, dash: [2, 4] }); });
  d.text(130, 66, 'requests', { cls: 'xs', a: 'end' });
  [['idle 30 min', 80, false, 'ends 30 min after the first gap'], ['sliding', 80, true, 'each request pushes the end out'], ['absolute 12 h', 720, false, '']].forEach(([s, m, hot, note], i) => { const y = 110 + i * 50; d.text(130, y + 11, s, { cls: 'sm', a: 'end' }); hourglass(d, X(m) + 14, y - 4, 30, { level: 1, stroke: hot ? C.acc : C.ink2 }); d.rect(X(0), y, X(m) - X(0), 22, { r: 3, fill: hot ? C.accSoft : i === 2 ? C.paper : C.card, stroke: hot ? C.acc : C.ink2, dash: i === 2 ? [4, 3] : undefined }); if (note) d.text(X(m) + 34, y + 11, note, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_auth_fixation() {
  const d = fig('be_auth_fixation', 'SESSION FIXATION: THE ATTACKER CHOOSES THE ID BEFORE THE VICTIM LOGS IN', 320);
  const xs = actors(d, ['attacker', 'victim browser', 'Wren API'], 44, 300, { x0: 90, x1: 550 });
  say(d, xs[0], xs[2], 96, 'gets anonymous sid=AAA');
  say(d, xs[0], xs[1], 136, 'plants sid=AAA (link, sibling cookie)');
  say(d, xs[1], xs[2], 180, 'POST /login with sid=AAA');
  d.rect(xs[2] - 60, 192, 120, 34, { r: 5, fill: C.accSoft, stroke: C.acc }); d.text(xs[2], 209, 'AAA now = user 42', { cls: 'xs', color: C.acc });
  say(d, xs[0], xs[2], 262, 'GET /me with sid=AAA', { hot: true });
  return d.svg();
}

export function be_auth_rotation() {
  const d = fig('be_auth_rotation', 'ROTATE THE ID WHENEVER PRIVILEGE CHANGES: LOGIN, MFA, ROLE CHANGE', 280);
  tag(d, 60, 100, 90, 'sid AAA'); d.text(105, 150, 'anonymous', { cls: 'xs' });
  cross(d, 105, 113, 12, C.ink2);
  d.arrow(165, 113, 230, 113, { stroke: C.gray, hl: 5 }); d.text(198, 96, 'login', { cls: 'xs' });
  tag(d, 250, 100, 100, 'sid 8f2c', { hot: true }); d.text(300, 150, 'user 42', { cls: 'xs', color: C.acc });
  d.arrow(365, 113, 430, 113, { stroke: C.gray, hl: 5 }); d.text(398, 96, 'step-up MFA', { cls: 'xs' });
  tag(d, 450, 100, 100, 'sid 3c9d', { hot: true }); d.text(500, 150, 'user 42 + MFA', { cls: 'xs', color: C.acc });
  d.person(105, 190, 30, { stroke: C.gray }); d.text(105, 238, 'planted AAA is now worthless', { cls: 'xs' });
  return d.svg();
}

export function be_auth_hijack() {
  const d = fig('be_auth_hijack', 'SESSION HIJACKING: A STOLEN ID WORKS FROM ANY MACHINE UNTIL THE SERVER KILLS IT', 300);
  d.phone(60, 70, 100); d.text(86, 190, 'user 42, Pune', { cls: 'xs' });
  d.laptop(470, 80, 120, { label: 'attacker, elsewhere' });
  d.server(260, 80, 100, 110, { label: 'Wren API' });
  d.arrow(120, 120, 254, 120, { stroke: C.ink2 }); d.arrow(464, 130, 366, 130, { stroke: C.acc });
  d.mono(410, 116, 'sid=8f2c', { size: 9.5, color: C.acc });
  d.text(320, 250, 'signals: new IP and country, new user agent, impossible travel; responses: re-auth, revoke', { cls: 'xs' });
  return d.svg();
}

export function be_auth_logout() {
  const d = fig('be_auth_logout', 'LOGOUT DELETES THE SERVER RECORD; CLEARING THE COOKIE ALONE IS NOT ENOUGH', 320);
  panel(d, 20, 40, 290, 250, 'logout this device', true);
  d.db(50, 90, 70, 70, {}); cross(d, 85, 125, 14);
  d.mono(210, 100, 'DEL sess:8f2c', { size: 10, color: C.acc }); d.mono(210, 124, 'Max-Age=0', { size: 9 });
  d.laptop(140, 180, 70, { stroke: C.gray }); d.mono(175, 256, 'copied 8f2c: dead too', { size: 8.5 });
  panel(d, 330, 40, 290, 250, 'log out everywhere');
  [0, 1, 2].forEach((i) => { d.phone(360 + i * 50, 90, 50); cross(d, 373 + i * 50, 115, 8, C.ink2); });
  d.mono(475, 180, 'session_version: 7 → 8', { size: 9.5 }); d.text(475, 206, 'sessions made at 7 fail', { cls: 'xs' }); d.text(475, 222, 'their next lookup', { cls: 'xs' });
  d.text(475, 260, 'or delete via a per-user index set', { cls: 'xs' });
  return d.svg();
}

export function be_auth_devices() {
  const d = fig('be_auth_devices', 'A DEVICE LIST IS JUST THE USER\'S SESSIONS, LABELLED', 300);
  browser(d, 120, 40, 400, 230, 'https://app.wren.example/settings/sessions');
  [['iPhone, Wren 5.2', 'Pune, active now', true], ['Chrome on Windows', 'Mumbai, 2 days ago', false], ['Firefox on Linux', 'Berlin, 5 min ago', false]].forEach(([a, b, cur], i) => { const y = 80 + i * 56; d.rect(140, y, 360, 44, { r: 6, fill: cur ? C.accFaint : C.card, stroke: cur ? C.acc : C.ink2 }); d.text(156, y + 15, a, { cls: 'ttl', size: 11, a: 'start' }); d.text(156, y + 32, b, { cls: 'xs', a: 'start' }); d.box(420, y + 10, 66, 24, cur ? 'this one' : 'revoke', { r: 5, size: 10, fill: cur ? C.accSoft : C.paper, stroke: cur ? C.acc : C.ink2 }); });
  return d.svg();
}

export function be_auth_concurrent() {
  const d = fig('be_auth_concurrent', 'A LIMIT OF 3 CONCURRENT SESSIONS: THE FOURTH LOGIN EVICTS THE OLDEST', 280);
  [['mon', 0], ['tue', 1], ['wed', 2]].forEach(([s, i]) => { const x = 70 + i * 110; d.phone(x, 80, 70, { stroke: i === 0 ? C.gray : C.ink2, fill: i === 0 ? C.paper : C.card }); d.text(x + 18, 170, s, { cls: 'sm' }); });
  cross(d, 88, 115, 14);
  d.shift(-60, 0, (dd) => dd.phone(470, 80, 70, { stroke: C.acc, fill: C.accSoft }), { at: [0.2, 0.6], back: true });
  d.text(488, 170, 'thu, new', { cls: 'sm', color: C.acc });
  d.text(320, 230, 'per-user sorted set of session ids by creation time; one range delete evicts the oldest', { cls: 'xs' });
  return d.svg();
}

export function be_pw_fast_hash() {
  const d = fig('be_pw_fast_hash', 'CRACKING EVERY 8-CHARACTER LOWERCASE-AND-DIGIT PASSWORD (36^8 = 2.82 x 10^12)', 300);
  d.rect(30, 70, 110, 70, { r: 6, fill: C.card, stroke: C.ink2 }); for (let i = 0; i < 4; i++) d.line(40 + i * 24, 140, 40 + i * 24, 150, { stroke: C.ink2, sw: 2, single: true }); d.gear(70, 105, 18, { spin: 0.6 }); d.gear(110, 105, 14, { spin: 0.6, ccw: true }); d.text(85, 170, 'one GPU', { cls: 'xs' });
  d.clock(220, 110, 60, { spin: 1.2 }); d.text(220, 165, 'SHA-256', { cls: 'ttl' }); d.mono(220, 186, '282 seconds', { size: 10 });
  hourglass(d, 470, 70, 80, { level: 0.15, stroke: C.acc }); d.text(470, 175, 'bcrypt', { cls: 'ttl', color: C.acc }); d.mono(470, 196, '8.9 years', { size: 10, color: C.acc });
  d.text(345, 115, '10¹⁰/s vs 10⁴/s', { cls: 'mono', size: 9.5 });
  d.text(320, 260, 'illustrative single-GPU rates; the ratio, not the exact numbers, is the point', { cls: 'xs' });
  return d.svg();
}

export function be_pw_rainbow() {
  const d = fig('be_pw_rainbow', 'WITHOUT A SALT, ONE PRECOMPUTED TABLE CRACKS EVERY USER AT ONCE', 310);
  d.path('M40,70 L160,62 L160,230 L40,238 Z', { fill: C.card, stroke: C.ink2 }); d.path('M160,62 L280,70 L280,238 L160,230 Z', { fill: C.paper, stroke: C.ink2 });
  [['5e8848…', 'password'], ['ef92b7…', '123456'], ['65e84b…', 'qwerty']].forEach(([h, p], i) => { d.mono(100, 100 + i * 40, h, { size: 9 }); d.mono(220, 100 + i * 40, p, { size: 9 }); });
  d.text(160, 256, 'lookup book, computed once', { cls: 'xs' });
  [['user 42', '5e8848…'], ['user 43', '5e8848…'], ['user 44', 'ef92b7…']].forEach(([u, h], i) => { const y = 80 + i * 56; d.person(370, y, 30, { stroke: i < 2 ? C.acc : C.ink2, fill: i < 2 ? C.accSoft : C.card }); d.mono(400, y + 16, `${u}: ${h}`, { size: 9, a: 'start', color: i < 2 ? C.acc : undefined }); });
  d.arrow(284, 120, 350, 110, { stroke: C.acc, hl: 5 });
  d.text(450, 270, 'same password, same hash: one crack, many users', { cls: 'xs' });
  return d.svg();
}

export function be_pw_salt() {
  const d = fig('be_pw_salt', 'A RANDOM PER-USER SALT MAKES THE SAME PASSWORD HASH DIFFERENTLY', 300);
  [['user 42', '9f1c…', 'a7d0…', 140], ['user 43', '0b3e…', '41c9…', 480]].forEach(([u, salt, h, x]) => {
    d.person(x - 90, 60, 30); d.text(x - 90, 104, u, { cls: 'xs' });
    tag(d, x - 50, 60, 70, '"hunter2"'); d.mono(x + 50, 72, `+ ${salt}`, { size: 9.5, color: C.acc, a: 'start' });
    grinder(d, x, 110, 'hash', { spin: 3 });
    d.rect(x - 50, 220, 100, 26, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(x, 233, h, { size: 10, color: C.acc });
  });
  d.text(320, 280, 'salts sit in the clear beside the hash; their job is uniqueness, not secrecy', { cls: 'xs' });
  return d.svg();
}

export function be_pw_pepper() {
  const d = fig('be_pw_pepper', 'A PEPPER IS A SECRET KEPT OUTSIDE THE DATABASE', 260);
  d.db(40, 70, 120, 100, { label: 'users table' }); d.text(100, 190, 'salt + hash', { cls: 'xs' });
  d.rect(250, 80, 140, 80, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(320, 110, 'KMS / HSM', { cls: 'ttl', color: C.acc }); d.text(320, 132, 'pepper key', { cls: 'xs' });
  d.text(510, 100, 'HMAC(pepper, argon2(pw, salt))', { cls: 'mono', size: 9.5 });
  d.text(510, 140, 'a stolen DB dump alone\ncannot be cracked offline', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_pw_kdfs() {
  const d = fig('be_pw_kdfs', 'THREE PASSWORD HASHES: WHAT EACH ONE MAKES EXPENSIVE', 310);
  [['bcrypt (1999)', 'CPU time', 'cost 12 = 2¹² rounds', '72-byte input limit', 0], ['scrypt (2009)', 'CPU + memory', 'N, r, p parameters', 'hurts GPU parallelism', 1], ['Argon2id (2015)', 'CPU + memory + lanes', 'm=19 MiB, t=2, p=1', 'OWASP minimum', 2]].forEach(([t, k, a, b, i]) => {
    const x = 115 + i * 205;
    d.cpu(x - 60, 70, 50, { label: 'CPU', size: 8.5, fill: C.card });
    if (i >= 1) d.ram(x + 4, 82, 64, 30, { chip: () => (i === 2 ? C.accSoft : C.paper) });
    if (i === 2) [0, 1, 2].forEach((k2) => d.line(x - 70, 140 + k2 * 6, x + 70, 140 + k2 * 6, { stroke: C.acc, single: true, sw: 0.9 }));
    d.text(x, 180, t, { cls: 'ttl', color: i === 2 ? C.acc : undefined }); d.text(x, 200, k, { cls: 'sm' }); d.mono(x, 224, a, { size: 9 }); d.text(x, 244, b, { cls: 'xs' });
  });
  return d.svg();
}

export function be_pw_work_factor() {
  const d = fig('be_pw_work_factor', 'EACH +1 ON THE BCRYPT COST DOUBLES THE WORK, FOR YOU AND FOR THE ATTACKER', 300);
  [['10', 62.5], ['11', 125], ['12', 250], ['13', 500]].forEach(([c, ms], i) => { const x = 110 + i * 130, h = ms * 0.36; hourglass(d, x, 230 - h, h, { level: 0.5, stroke: i === 2 ? C.acc : C.ink2 }); d.mono(x, 252, `cost ${c}`, { size: 9.5, color: i === 2 ? C.acc : undefined }); d.mono(x, 270, `${ms} ms`, { size: 9 }); });
  d.text(320, 60, 'at 20 logins/s, cost 12 needs 5 cores just for hashing', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_pw_record() {
  const d = fig('be_pw_record', 'THE STORED STRING CARRIES ITS OWN ALGORITHM AND PARAMETERS', 260);
  d.rect(20, 70, 600, 44, { r: 22, fill: C.paper, stroke: C.ink2 });
  const parts = [['$argon2id', 'algorithm'], ['$v=19', 'version'], ['$m=19456,t=2,p=1', 'cost'], ['$<salt>', 'salt'], ['$<hash>', 'hash']];
  let x = 40; parts.forEach(([s, l], i) => { const w = s.length * 8 + 16; d.rect(x, 78, w, 28, { r: 5, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.mono(x + w / 2, 92, s, { size: 10 }); d.text(x + w / 2, 128, l, { cls: 'xs', color: i === 2 ? C.acc : undefined }); x += w + 8; });
  d.text(320, 190, 'raise m or t later: re-hash each user at their next successful login', { cls: 'xs' });
  return d.svg();
}

export function be_pw_timing() {
  const d = fig('be_pw_timing', 'AN EARLY-EXIT COMPARE TAKES LONGER THE MORE LEADING BYTES MATCH', 310);
  d.text(60, 50, 'stored:', { cls: 'xs', a: 'start' }); d.tape(110, 40, ['a9', 'f1', '3c', '77', '0e'], { cw: 40, h: 24 });
  [['b7', 1], ['a3', 2], ['a9 f1 3c', 4]].forEach(([g, n], i) => { const y = 100 + i * 50; d.mono(80, y + 12, g, { size: 10, a: 'end' }); for (let k = 0; k < n; k++) d.rect(110 + k * 40, y, 38, 24, { r: 2, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.clock(340, y + 12, 28, { t: n / 8 }); d.text(362, y + 12, `${n} byte${n > 1 ? 's' : ''} compared`, { cls: 'xs', a: 'start' }); });
  d.text(320, 280, 'hmac.compare_digest and crypto.timingSafeEqual always compare every byte', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_pw_enumeration() {
  const d = fig('be_pw_enumeration', 'USER ENUMERATION: DIFFERENT TIMING OR TEXT REVEALS WHICH EMAILS EXIST', 300);
  d.laptop(30, 100, 110, { label: 'prober' });
  [['nobody@…', '3 ms', '"no such user"', 70], ['asha@…', '250 ms', '"wrong password"', 170]].forEach(([e, t, m, y], i) => { d.mono(170, y, e, { size: 9.5, a: 'start' }); d.arrow(260, y, 330, y, { stroke: C.gray, hl: 5 }); d.clock(360, y, 34, { t: i ? 0.7 : 0.02, hand: i ? C.acc : C.ink2 }); d.mono(390, y - 8, t, { size: 9.5, a: 'start', color: i ? C.acc : undefined }); d.mono(390, y + 10, m, { size: 9, a: 'start' }); });
  d.text(320, 260, 'fix: hash a dummy password for unknown users and return one generic message', { cls: 'xs' });
  return d.svg();
}

export function be_pw_stuffing() {
  const d = fig('be_pw_stuffing', 'CREDENTIAL STUFFING: 1,000,000 LEAKED PAIRS, ONE TRY EACH, 0.5% REUSE', 300);
  d.doc(30, 60, 110, 150, { label: 'breach of other site' });
  d.arrow(146, 135, 220, 135, { stroke: C.gray });
  for (let i = 0; i < 24; i++) d.laptop(230 + (i % 6) * 38, 70 + Math.floor(i / 6) * 34, 28);
  d.text(340, 220, 'botnet: thousands of IPs', { cls: 'xs' });
  d.arrow(460, 135, 520, 135, { stroke: C.acc }); d.server(530, 90, 70, 90, { stroke: C.acc, fill: C.accSoft });
  d.text(565, 210, '5,000 accounts\ntaken over', { cls: 'sm', vc: true, color: C.acc });
  d.text(320, 270, 'per-account limits never trigger: each account sees one attempt', { cls: 'xs' });
  return d.svg();
}

export function be_pw_spraying() {
  const d = fig('be_pw_spraying', 'PASSWORD SPRAYING: A FEW COMMON PASSWORDS AGAINST EVERY ACCOUNT', 280);
  ['Summer2026!', 'Wren@123', 'password1'].forEach((p, i) => { d.chips(30, 60 + i * 50, [p], { h: 28, fill: C.accSoft, stroke: C.acc }); });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) d.person(260 + c * 44, 50 + r * 46, 26);
  d.text(320, 255, '3 attempts x 1,000,000 accounts, spread slowly to stay under any lockout threshold', { cls: 'xs' });
  return d.svg();
}

export function be_pw_limits() {
  const d = fig('be_pw_limits', 'LAYERED LOGIN DEFENCES: EACH LIMIT CATCHES A DIFFERENT ATTACK SHAPE', 330);
  const rows = [['per account', '5 failures / min', 'brute force on one user'], ['per IP', '20 / min', 'one noisy machine'], ['global failure rate', 'alert on spike', 'stuffing from a botnet'], ['breached-password check', 'signup and login', 'reused passwords'], ['MFA', 'second factor', 'everything above']];
  rows.forEach(([a, b, c], i) => { const y = 50 + i * 48, hot = i === 2; d.rect(150, y, 20, 38, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); for (let k = 0; k < 6; k++) d.line(150, y + 4 + k * 6, 170, y + 4 + k * 6, { stroke: C.line, single: true }); d.text(140, y + 19, a, { cls: 'sm', a: 'end' }); d.mono(190, y + 19, b, { size: 9.5, a: 'start' }); d.text(380, y + 19, c, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined }); });
  d.travel([[40, 70], [148, 70]], { token: 'packet', at: [0, 0.5] }); d.travel([[40, 166], [148, 166]], { token: 'packet', at: [0.3, 0.8] });
  d.text(320, 312, 'hard lockout lets anyone lock any user out; prefer delays, CAPTCHA and step-up', { cls: 'xs' });
  return d.svg();
}

export function be_pw_reset_flow() {
  const d = fig('be_pw_reset_flow', 'A SAFE PASSWORD RESET IN EIGHT STEPS', 340);
  d.person(50, 60, 34); d.server(260, 50, 70, 80, {}); d.db(470, 60, 70, 60, {}); inbox(d, 60, 220, { hot: true });
  [['1 request', 'same reply always', 110, 74], ['2 random token', '32 bytes', 260, 152], ['3 store sha256(token)', '4 expires in 30 min', 505, 140], ['5 email link', 'canonical host only', 150, 208]].forEach(([a, b, x, y]) => { d.text(x, y, a, { cls: 'sm' }); d.text(x, y + 16, b, { cls: 'xs' }); });
  d.arrow(86, 80, 252, 85, { stroke: C.gray, hl: 5 }); d.arrow(334, 90, 466, 90, { stroke: C.acc, hl: 5 }); d.arrow(258, 130, 136, 222, { stroke: C.gray, hl: 5 });
  d.travel([[258, 130], [136, 222]], { token: 'packet', at: [0.1, 0.5] });
  card(d, 330, 210, 290, ['6 validate: hash, expiry, unused', '7 set the new password hash', '8 burn token, end all sessions'], { size: 9.5, hot: [2], bold: false });
  d.arrow(134, 245, 326, 245, { stroke: C.gray, hl: 5 });
  return d.svg();
}

export function be_pw_reset_bugs() {
  const d = fig('be_pw_reset_bugs', 'FOUR WAYS RESET FLOWS LEAK ACCOUNTS', 320);
  const T = [['Host header poisoning', 'link built from Host: evil.example'], ['token leaks', 'URL token reaches logs and Referer'], ['no expiry or reuse', 'an old email in a breached inbox works'], ['sessions survive', 'attacker stays logged in after reset']];
  T.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 130; d.rect(x, y, 290, 110, { r: 8, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.line }); d.text(x + 150, y + 82, t, { cls: 'ttl' }); d.text(x + 150, y + 100, s, { cls: 'xs' });
    const cx = x + 150, cy = y + 38;
    if (i === 0) { d.envelope(cx - 60, cy - 18, 50, 32, {}); d.mono(cx + 30, cy, 'evil.example/reset?t=…', { size: 8.5, color: C.acc }); }
    if (i === 1) { d.doc(cx - 70, cy - 26, 40, 50, {}); d.doc(cx + 30, cy - 26, 40, 50, {}); d.mono(cx, cy, 't=…', { size: 9, color: C.acc }); }
    if (i === 2) { inbox(d, cx - 80, cy - 25); hourglass(d, cx + 40, cy - 26, 50, { level: 0 }); }
    if (i === 3) { d.laptop(cx - 30, cy - 26, 60); d.blink((dd) => dd.dot(cx, cy - 8, 4, C.acc)); }
  });
  return d.svg();
}

export function be_jwt_anatomy() {
  const d = fig('be_jwt_anatomy', 'A JWT IS THREE BASE64URL PARTS JOINED BY DOTS: 560 CHARACTERS FOR WREN', 300);
  token3(d, 30, 70, 0, [['eyJhbGciOiJSUzI1NiIs…', 170], ['eyJpc3MiOiJodHRwczov…', 190], ['Kx9cQ2…(342 chars)', 200]], { size: 9 });
  d.text(115, 120, 'header: alg, typ, kid', { cls: 'sm' }); d.text(318, 120, 'payload: claims', { cls: 'sm' }); d.text(510, 120, 'signature', { cls: 'sm', color: C.acc });
  d.circle(200, 190, 34, { fill: C.paper, stroke: C.ink2 }); d.line(222, 212, 240, 230, { stroke: C.ink2, sw: 3, single: true }); d.text(270, 190, 'anyone can decode', { cls: 'xs', a: 'start' }); d.text(270, 206, 'header and payload', { cls: 'xs', a: 'start' });
  d.lock(470, 170, 26, { stroke: C.acc }); d.text(500, 220, 'the signature covers header.payload', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_jwt_claims() {
  const d = fig('be_jwt_claims', 'THE REGISTERED CLAIMS IN WREN\'S ACCESS TOKEN', 330);
  d.rect(40, 50, 300, 260, { r: 10, fill: C.card, stroke: C.ink2 }); d.circle(80, 90, 40, { fill: C.paper, stroke: C.ink2 }); d.person(80, 74, 26); d.text(190, 80, 'ACCESS', { cls: 'mono', size: 12, w: 600 });
  const L = [['iss', 'https://auth.wren.example', 'who issued it'], ['sub', '"42"', 'whom it is about'], ['aud', 'api.wren.example', 'who must accept it'], ['iat', '1791366300', 'issued at'], ['exp', '1791367200', 'iat + 900 s'], ['jti', '"a1b2"', 'id, for revocation'], ['scope', 'orders:read', 'what it allows']];
  L.forEach(([k, v, s], i) => { const y = 130 + i * 24, hot = i === 2 || i === 4; d.mono(56, y, k, { a: 'start', size: 9.5, color: hot ? C.acc : undefined, w: 600 }); d.mono(110, y, v, { a: 'start', size: 9 }); d.text(370, y, s, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined }); d.line(342, y, 364, y, { stroke: C.line, single: true }); });
  return d.svg();
}

export function be_jwt_hs_vs_rs() {
  const d = fig('be_jwt_hs_vs_rs', 'HS256 SHARES ONE SECRET; RS256 AND ES256 SPLIT SIGNING FROM VERIFYING', 300);
  panel(d, 20, 40, 290, 230, 'HS256 (HMAC)');
  d.server(50, 90, 60, 70, { label: 'auth' }); d.server(200, 90, 60, 70, { label: 'api' });
  d.key(70, 190, 30); d.key(220, 190, 30);
  d.text(165, 245, 'every verifier can also mint tokens', { cls: 'xs' });
  panel(d, 330, 40, 290, 230, 'RS256 / ES256', true);
  d.server(360, 90, 60, 70, { label: 'auth' }); d.server(510, 90, 60, 70, { label: 'api' });
  d.key(380, 190, 30, { fill: C.accSoft, stroke: C.acc }); d.text(395, 220, 'private', { cls: 'xs', color: C.acc });
  d.lock(528, 180, 24); d.text(540, 220, 'public', { cls: 'xs' });
  d.text(475, 245, 'verifiers cannot forge', { cls: 'xs' });
  return d.svg();
}

export function be_jwt_verify_steps() {
  const d = fig('be_jwt_verify_steps', 'VERIFY IN THIS ORDER, AND TRUST NOTHING IN THE PAYLOAD UNTIL STEP 3 PASSES', 300);
  const G = [['parse', 'three parts'], ['pick key', 'kid, fixed alg'], ['signature', 'reject on fail'], ['claims', 'iss, aud, exp, nbf'], ['use sub', 'now trusted']];
  G.forEach(([a, b], i) => { const x = 70 + i * 125, hot = i === 2; d.rect(x - 40, 80, 80, 90, { r: 4, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); d.path(`M${x - 40},80 Q${x},${50} ${x + 40},80`, { stroke: hot ? C.acc : C.ink2, single: true }); d.text(x, 115, a, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x, 138, b, { cls: 'xs' }); if (i < 4) d.arrow(x + 44, 125, x + 81, 125, { stroke: C.gray, hl: 5 }); });
  d.travel([[30, 200], [610, 200]], { token: (dd) => token3(dd, -30, -9, 0, [['', 18], ['', 18], ['', 18]], { h: 18 }) });
  d.text(320, 250, 'the algorithm comes from your configuration, never from the token header', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_jwt_jwks() {
  const d = fig('be_jwt_jwks', 'KEY ROTATION WITH JWKS: PUBLISH THE NEW KEY BEFORE SIGNING WITH IT', 320);
  d.rect(30, 60, 180, 120, { r: 8, fill: C.paper, stroke: C.ink2 }); d.mono(120, 78, '/.well-known/jwks.json', { size: 8.5 });
  [['2026-09', 0], ['2026-10', 1]].forEach(([k, i]) => { d.key(56, 110 + i * 40, 34, { fill: i ? C.accSoft : C.card, stroke: i ? C.acc : C.ink2 }); d.mono(130, 110 + i * 40, `kid ${k}`, { size: 9, color: i ? C.acc : undefined }); });
  const X = (t) => 250 + t * 34;
  [['kid 2026-09 signs', 0, 4, false], ['kid 2026-09 verifies', 0, 7, false], ['kid 2026-10 published', 2, 10, false], ['kid 2026-10 signs', 4, 10, true]].forEach(([s, a, b, hot], i) => { const y = 70 + i * 46; d.rect(X(a), y, X(b) - X(a), 20, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(X(a) + 4, y + 32, s, { cls: 'xs', a: 'start' }); });
  [0, 2, 4, 7, 10].forEach((t) => d.mono(X(t), 270, `day ${t}`, { size: 8.5 }));
  d.text(320, 300, 'the old key stays published until every token it signed has expired', { cls: 'xs' });
  return d.svg();
}

export function be_jwt_vs_opaque() {
  const d = fig('be_jwt_vs_opaque', 'SELF-CONTAINED JWT VERSUS OPAQUE TOKEN WITH A LOOKUP', 320);
  panel(d, 20, 40, 290, 250, 'JWT', true);
  token3(d, 50, 80, 0, [['h', 40], ['claims', 90], ['sig', 60]], { h: 26 }); d.server(130, 140, 70, 70, {}); d.lock(210, 160, 20, { stroke: C.acc });
  d.text(165, 236, 'verified locally, no lookup', { cls: 'xs', color: C.acc }); d.text(165, 256, 'cannot be revoked before exp', { cls: 'xs' }); d.text(165, 272, 'without extra state', { cls: 'xs' });
  panel(d, 330, 40, 290, 250, 'opaque token');
  tag(d, 400, 80, 140, 'tok_9f2c…'); d.server(380, 140, 70, 70, {}); d.db(510, 150, 60, 50, {}); d.arrow(454, 175, 506, 175, { stroke: C.ink2, hl: 5, both: true });
  d.text(475, 236, 'one store call per request', { cls: 'xs' }); d.text(475, 256, 'revoked instantly', { cls: 'xs' }); d.text(475, 272, 'by deleting the row', { cls: 'xs' });
  return d.svg();
}

export function be_tok_access_refresh() {
  const d = fig('be_tok_access_refresh', 'SHORT ACCESS TOKENS RENEWED BY A LONG-LIVED REFRESH TOKEN', 300);
  const X = (m) => 80 + m * 8;
  d.arrow(70, 230, 620, 230, { stroke: C.gray });
  [0, 15, 30, 45].forEach((m, i) => { hourglass(d, X(m) + 58, 140, 40, { level: i === 1 ? 0.5 : 1, stroke: i === 1 ? C.acc : C.ink2 }); d.text(X(m) + 58, 200, `access ${i + 1}`, { cls: 'xs', color: i === 1 ? C.acc : undefined }); d.mono(X(m), 246, `${m}m`, { size: 9 }); if (i) d.carrow([[X(m) - 6, 90], [X(m) + 4, 110], [X(m) + 40, 136]], { stroke: C.gray }); });
  d.rect(X(0), 70, X(65) - X(0), 22, { r: 3, fill: C.paper, stroke: C.ink2, dash: [4, 3] }); d.key(X(0) + 8, 81, 26); d.text(X(0) + 44, 81, 'refresh token, 30 days', { cls: 'xs', a: 'start' });
  d.text(320, 278, 'a stolen access token is useful for at most 15 minutes', { cls: 'xs' });
  return d.svg();
}

export function be_tok_rotation() {
  const d = fig('be_tok_rotation', 'REFRESH ROTATION WITH REUSE DETECTION: A REPLAYED OLD TOKEN KILLS THE WHOLE FAMILY', 300);
  ['R1', 'R2', 'R3'].forEach((s, i) => { d.chips(60 + i * 140, 80, [s], { h: 30, fill: i === 2 ? C.card : C.paper }); if (i < 2) d.arrow(110 + i * 140, 95, 190 + i * 140, 95, { stroke: C.gray, hl: 5 }); d.text(85 + i * 140, 130, i < 2 ? 'used, retired' : 'current', { cls: 'xs' }); });
  d.person(500, 70, 34); d.mono(540, 90, 'R1 again', { size: 10, color: C.acc, a: 'start' });
  d.arrow(500, 120, 400, 180, { stroke: C.acc });
  d.rect(220, 170, 200, 50, { r: 7, fill: C.accSoft, stroke: C.acc }); d.text(320, 195, 'revoke R1, R2, R3 family', { cls: 'sm', color: C.acc });
  d.text(320, 260, 'someone holds a copy; the server cannot tell who, so it ends every token in the chain', { cls: 'xs' });
  return d.svg();
}

export function be_tok_revocation() {
  const d = fig('be_tok_revocation', 'A JTI DENY LIST ONLY NEEDS TO REMEMBER TOKENS THAT HAVE NOT EXPIRED YET', 260);
  d.db(60, 70, 130, 100, { label: 'denylist\n(Redis)' });
  d.mono(125, 190, 'SET deny:a1b2 1 EX 900', { size: 9.5 });
  d.text(450, 100, '10,000 logouts/day x 900 s / 86,400 s', { cls: 'mono', size: 10 });
  d.text(450, 126, '= 104 live entries on average', { cls: 'mono', size: 10, color: C.acc });
  d.text(450, 180, 'every request now checks the list:\nthe JWT is no longer fully stateless', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tok_storage() {
  const d = fig('be_tok_storage', 'WHERE A BROWSER APP KEEPS TOKENS, AND WHAT EACH PLACE IS EXPOSED TO', 330);
  browser(d, 20, 40, 380, 270, 'app.wren.example');
  const R = [['localStorage', 'any XSS reads it', 'no CSRF'], ['JS memory', 'XSS during the session', 'lost on reload'], ['HttpOnly cookie', 'XSS cannot read it', 'needs CSRF defence'], ['BFF holds tokens', 'browser has a session only', 'extra hop']];
  R.forEach(([a, b, c], i) => { const y = 80 + i * 56, hot = i === 2; d.rect(40, y, 120, 40, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(100, y + 20, a, { cls: 'sm', size: 10, color: hot ? C.acc : undefined }); d.text(180, y + 12, b, { cls: 'xs', a: 'start' }); d.text(180, y + 28, c, { cls: 'xs', a: 'start' }); if (hot) d.lock(372, y + 8, 20, { stroke: C.acc }); });
  d.server(470, 230, 70, 70, { label: 'BFF' }); d.arrow(402, 265, 466, 265, { stroke: C.gray, hl: 5 }); d.key(560, 255, 30);
  d.text(520, 100, 'XSS script', { cls: 'xs', color: C.acc }); d.arrow(500, 110, 166, 100, { stroke: C.acc, hl: 5, dash: [4, 3] });
  return d.svg();
}

export function be_jwt_alg_confusion() {
  const d = fig('be_jwt_alg_confusion', 'ALGORITHM CONFUSION: THE PUBLIC KEY BECOMES AN HMAC SECRET', 300);
  card(d, 20, 50, 280, ['header: {"alg":"HS256"}', 'payload: {"sub":"1","role":"admin"}', 'sig: HMAC(public_key_pem, ...)'], { hot: [0, 2] });
  d.lock(350, 80, 30); d.text(365, 130, 'public key,\nanyone can fetch it', { cls: 'xs', vc: true });
  d.rect(430, 60, 190, 100, { r: 8, fill: C.accSoft, stroke: C.acc });
  d.text(525, 85, 'naive library:', { cls: 'sm' }); d.mono(525, 110, 'verify(token, key)', { size: 10 }); d.text(525, 135, 'trusts "HS256", passes', { cls: 'sm', color: C.acc });
  d.text(320, 220, 'fix: pin the algorithm per key: verify(token, key, algorithms=["RS256"])', { cls: 'xs' });
  d.text(320, 244, 'and reject "alg":"none" outright', { cls: 'xs' });
  return d.svg();
}

export function be_jwt_checks() {
  const d = fig('be_jwt_checks', 'A VALID SIGNATURE IS NOT A VALID TOKEN: FOUR CLAIM CHECKS AFTER IT', 310);
  const G = [['iss', 'our auth server, not a test one'], ['aud', 'api.wren.example, not another API'], ['exp', 'not expired (about 60 s skew)'], ['nbf', 'not before its start time']];
  G.forEach(([c, s], i) => { const y = 60 + i * 52; d.rect(40, y, 70, 34, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(75, y + 17, c, { size: 12, color: C.acc }); d.line(110, y + 17, 130, y + 17, { stroke: C.acc, sw: 2, single: true }); d.circle(140, y + 17, 18, { fill: C.paper, stroke: C.acc }); tick(d, 140, y + 17, 6); d.text(162, y + 17, s, { cls: 'sm', a: 'start' }); });
  d.server(470, 80, 70, 80, { label: 'analytics API' }); d.server(470, 190, 70, 80, { label: 'payments API', stroke: C.acc }); cross(d, 560, 230, 10);
  d.mono(505, 70, 'aud: analytics', { size: 8.5 });
  return d.svg();
}

export function be_jwt_leak() {
  const d = fig('be_jwt_leak', 'ANYONE WHO SEES A JWT CAN DECODE ITS PAYLOAD; MANY PLACES SEE IT', 320);
  token3(d, 200, 50, 0, [['eyJ…', 50], ['eyJzdWIiOiI0MiIs…', 130], ['sig', 50]], { h: 26 });
  [['URL query', 'proxy and access logs', 90, 150], ['Referer', 'third-party sites', 250, 210], ['error tracker', 'request dumps', 400, 210], ['history', 'shared devices', 550, 150]].forEach(([a, b, x, y], i) => { d.doc(x - 22, y - 30, 44, 54, { fill: C.card }); d.text(x, y + 40, a, { cls: 'ttl', size: 10.5 }); d.text(x, y + 56, b, { cls: 'xs' }); d.line(320, 80, x, y - 34, { stroke: C.line, single: true, dash: [3, 4] }); });
  bubble(d, 220, 100, 200, 40, '{"sub":"42","email":"asha@…"}', { cls: 'mono', size: 8.5, tx: 300, ty: 82 });
  return d.svg();
}

export function be_oauth_actors() {
  const d = fig('be_oauth_actors', 'OAUTH 2.0 HAS FOUR ROLES', 320);
  d.person(110, 50, 44); d.text(110, 112, 'resource owner', { cls: 'ttl', size: 11 }); d.text(110, 128, 'user 42', { cls: 'xs' });
  d.phone(520, 46, 70); d.text(538, 128, 'client: Wren app', { cls: 'ttl', size: 11 });
  d.server(70, 180, 80, 80, { stroke: C.acc, fill: C.accSoft }); d.text(110, 276, 'authorization server', { cls: 'ttl', size: 11, color: C.acc }); d.text(110, 292, 'accounts.google.com', { cls: 'xs' });
  d.db(500, 190, 80, 70, {}); d.text(540, 276, 'resource server', { cls: 'ttl', size: 11 }); d.text(540, 292, 'Calendar API', { cls: 'xs' });
  d.arrow(150, 80, 500, 80, { stroke: C.gray, hl: 5 }); d.text(320, 66, 'approves access', { cls: 'xs' });
  d.arrow(156, 200, 506, 110, { stroke: C.acc, hl: 5 }); d.travel([[156, 200], [506, 110]], { token: (dd) => dd.key(-12, 0, 24, { fill: C.accSoft, stroke: C.acc }) }); d.text(330, 170, 'issues access token', { cls: 'xs', color: C.acc });
  d.arrow(540, 130, 540, 186, { stroke: C.gray, hl: 5 }); d.text(556, 160, 'calls with token', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function be_oauth_code_flow() {
  const d = fig('be_oauth_code_flow', 'AUTHORIZATION CODE FLOW: THE BROWSER CARRIES A CODE, THE SERVER TRADES IT FOR TOKENS', 380);
  const xs = actors(d, ['browser', 'Wren backend', 'auth server'], 44, 360, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 92, 'click "Sign in with Google"');
  say(d, xs[1], xs[0], 124, '302 to /authorize?client_id&redirect_uri&scope&state');
  say(d, xs[0], xs[2], 160, 'GET /authorize ...');
  d.rect(xs[2] - 50, 170, 100, 30, { r: 5, fill: C.card, stroke: C.ink2 }); d.text(xs[2], 185, 'login + consent', { cls: 'xs' });
  say(d, xs[2], xs[0], 222, '302 to redirect_uri?code=c0de&state');
  say(d, xs[0], xs[1], 256, 'GET /callback?code=c0de&state');
  say(d, xs[1], xs[2], 292, 'POST /token code + client secret + verifier', { hot: true });
  say(d, xs[2], xs[1], 330, 'access, refresh, id tokens', { hot: true });
  return d.svg();
}

export function be_oauth_pkce() {
  const d = fig('be_oauth_pkce', 'PKCE: ONLY THE PARTY THAT STARTED THE FLOW CAN FINISH IT', 320);
  d.phone(40, 70, 90); d.key(80, 190, 40, { fill: C.accSoft, stroke: C.acc }); d.text(100, 220, 'verifier stays here', { cls: 'xs', color: C.acc });
  d.server(470, 80, 90, 110, { label: 'auth server' });
  d.arrow(96, 100, 466, 100, { stroke: C.gray, hl: 5 }); d.mono(280, 88, '/authorize  challenge = sha256(verifier)', { size: 9 });
  d.lock(580, 110, 22); d.text(590, 150, 'stores', { cls: 'xs' });
  d.arrow(96, 160, 466, 160, { stroke: C.acc, hl: 5 }); d.mono(280, 148, '/token  code + verifier', { size: 9, color: C.acc });
  d.travel([[96, 160], [466, 160]], { token: (dd) => dd.key(-12, 0, 24, { fill: C.accSoft, stroke: C.acc }), at: [0.3, 0.8] });
  d.person(300, 210, 30, { stroke: C.gray }); d.text(300, 260, 'interceptor with the code only:', { cls: 'xs' }); d.text(300, 276, 'no verifier, no tokens', { cls: 'xs' });
  return d.svg();
}

export function be_oauth_client_credentials() {
  const d = fig('be_oauth_client_credentials', 'CLIENT CREDENTIALS: A SERVICE AUTHENTICATES AS ITSELF, NO USER INVOLVED', 260);
  const xs = actors(d, ['billing job', 'auth server', 'orders API'], 44, 240, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 100, 'POST /token client_id, secret, scope=orders:read');
  say(d, xs[1], xs[0], 136, 'access token (10 min)');
  say(d, xs[0], xs[2], 186, 'GET /orders?day=..., Bearer ...', { hot: true });
  return d.svg();
}

export function be_oauth_scopes() {
  const d = fig('be_oauth_scopes', 'SCOPES ARE WHAT THE USER CONSENTS TO, AND WHAT THE API CHECKS', 300);
  browser(d, 30, 40, 280, 230, 'https://accounts.example/consent');
  d.text(170, 90, 'Wren wants to:', { cls: 'ttl' });
  ['see your email address', 'add events to your calendar'].forEach((s, i) => { d.rect(56, 110 + i * 40, 18, 18, { r: 3, fill: C.accSoft, stroke: C.acc }); tick(d, 65, 119 + i * 40, 5); d.text(84, 119 + i * 40, s, { cls: 'sm', a: 'start' }); });
  d.box(120, 210, 100, 30, 'Allow', { r: 6, fill: C.accSoft, stroke: C.acc });
  card(d, 350, 80, 260, ['scope: "email calendar.events"', 'API: POST /events needs', '  calendar.events', 'GET /contacts needs contacts.read', '  -> 403 insufficient_scope'], { hot: [4] });
  return d.svg();
}

export function be_oauth_redirect_attack() {
  const d = fig('be_oauth_redirect_attack', 'A LOOSE REDIRECT URI SENDS THE CODE TO THE ATTACKER', 320);
  d.rect(20, 50, 400, 50, { r: 6, fill: C.paper, stroke: C.ink2 }); d.mono(30, 68, 'redirect_uri=https://app.wren.example', { a: 'start', size: 9.5 }); d.mono(30, 86, '.evil.example/cb', { a: 'start', size: 9.5, color: C.acc });
  d.server(460, 40, 80, 80, { label: 'auth server' }); d.mono(500, 138, 'startswith(registered)', { size: 9 }); d.text(500, 154, 'passes', { cls: 'xs', color: C.acc });
  d.envelope(470, 190, 60, 36, { label: 'code' }); d.travel([[500, 170], [360, 230], [160, 230]], { token: 'packet', at: [0, 0.7] });
  d.laptop(90, 200, 90, { label: 'evil.example' });
  d.text(320, 300, 'fix: exact string match on pre-registered redirect URIs, plus PKCE', { cls: 'xs' });
  return d.svg();
}

export function be_oauth_state() {
  const d = fig('be_oauth_state', 'WITHOUT state, AN ATTACKER CAN LOG THE VICTIM IN AS THE ATTACKER', 300);
  const xs = actors(d, ['attacker', 'victim browser', 'Wren callback'], 44, 280, { x0: 90, x1: 550 });
  d.text(xs[0], 96, 'starts own login,\nstops before callback', { cls: 'xs', vc: true });
  say(d, xs[0], xs[1], 150, 'link: /callback?code=ATTACKERS');
  say(d, xs[1], xs[2], 190, 'GET /callback?code=ATTACKERS', { hot: true });
  d.text(xs[2], 230, 'victim now in attacker\'s\naccount, saves a card', { cls: 'xs', vc: true, color: C.acc });
  d.text(320, 270, 'state = random value bound to the browser session; reject the callback if it differs', { cls: 'xs' });
  return d.svg();
}

export function be_oidc_id_token() {
  const d = fig('be_oidc_id_token', 'OIDC ADDS AN ID TOKEN: A SIGNED STATEMENT ABOUT THE LOGIN, FOR THE CLIENT', 320);
  d.rect(40, 60, 230, 140, { r: 10, fill: C.card, stroke: C.ink2 }); d.key(60, 100, 50); d.text(155, 100, 'access token', { cls: 'ttl' }); d.text(155, 130, 'for the resource API', { cls: 'xs' }); d.text(155, 150, 'what the app may do', { cls: 'xs' }); d.text(155, 170, 'opaque to the client', { cls: 'xs' });
  d.rect(330, 50, 270, 220, { r: 10, fill: C.accFaint, stroke: C.acc }); d.circle(380, 100, 50, { fill: C.paper, stroke: C.acc }); d.person(380, 82, 30, { stroke: C.acc }); d.text(480, 80, 'ID token', { cls: 'ttl', color: C.acc });
  ['iss: accounts.google.com', 'sub: 1043…', 'aud: <wren client_id>', 'nonce: n-7f3', 'email, auth_time'].forEach((s, i) => d.mono(350, 150 + i * 22, s, { a: 'start', size: 9, color: [2, 3].includes(i) ? C.acc : undefined }));
  d.text(155, 240, 'OAuth: may this app act?', { cls: 'xs' }); d.text(465, 290, 'OIDC: who logged in, and when', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_oidc_nonce() {
  const d = fig('be_oidc_nonce', 'THE NONCE TIES AN ID TOKEN TO THE LOGIN THAT ASKED FOR IT', 280);
  d.laptop(30, 70, 100, { label: 'Wren session' }); tag(d, 160, 80, 80, 'n-7f3', { hot: true });
  d.arrow(250, 93, 380, 93, { stroke: C.gray, hl: 5 }); d.text(315, 80, '/authorize?nonce=n-7f3', { cls: 'mono', size: 8.5 });
  d.server(390, 60, 70, 80, { label: 'IdP' });
  d.doc(500, 70, 90, 100, { fill: C.accFaint, stroke: C.acc }); d.mono(545, 150, 'nonce: n-7f3', { size: 8.5, color: C.acc });
  d.carrow([[545, 190], [320, 230], [200, 120]], { stroke: C.acc, dash: [4, 3] }); d.text(320, 250, 'compare with the session; a replayed token carries another nonce', { cls: 'xs' });
  return d.svg();
}

export function be_oauth_checklist() {
  const d = fig('be_oauth_checklist', 'AN OAUTH CLIENT CHECKLIST', 350);
  d.rect(60, 40, 520, 300, { r: 6, fill: C.paper, stroke: C.ink2 }); d.rect(270, 30, 100, 20, { r: 4, fill: C.card, stroke: C.ink2 });
  ['authorization code flow + PKCE, even for confidential clients', 'exact redirect URI match, registered in advance', 'state bound to the session; nonce in OIDC', 'client secret only on servers; rotate it; never in mobile apps', 'validate ID token: signature, iss, aud, exp, nonce', 'tokens never in URLs; no implicit flow', 'request the smallest scopes; handle insufficient_scope'].forEach((s, i) => { const y = 66 + i * 38; d.rect(80, y, 24, 24, { r: 4, fill: C.accSoft, stroke: C.acc }); tick(d, 92, y + 12, 6); d.text(118, y + 12, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

export function be_auth_e2e() {
  const d = fig('be_auth_e2e', 'SIGN IN WITH GOOGLE ON WREN: OIDC IN, A WREN SESSION OUT', 360);
  browser(d, 20, 60, 150, 110, 'app.wren.example'); d.server(250, 60, 90, 110, { label: 'Wren backend' }); d.server(500, 60, 90, 110, { label: 'Google', stroke: C.gray });
  const S = [['/login/google', 95, 196], ['state, nonce, PKCE', 295, 196], ['login + consent', 545, 196], ['callback: code + state', 95, 290], ['token call + verifier', 295, 250], ['validate ID token', 295, 290], ['user 42 by sub', 545, 250], ['__Host-sid cookie', 545, 290]];
  S.forEach(([s, x, y], i) => d.text(x, y, `${i + 1}. ${s}`, { cls: 'xs', color: i === 5 ? C.acc : undefined }));
  d.arrow(172, 100, 246, 100, { stroke: C.gray, hl: 5 }); d.arrow(344, 100, 496, 100, { stroke: C.gray, hl: 5 }); d.arrow(496, 140, 344, 140, { stroke: C.acc, hl: 5 }); d.arrow(246, 140, 172, 140, { stroke: C.gray, hl: 5 });
  d.travel([[172, 100], [246, 100], [344, 100], [496, 100], [496, 140], [344, 140], [246, 140], [172, 140]], { token: 'packet' });
  d.text(320, 336, 'Google proves identity once; Wren\'s own session carries it from then on', { cls: 'xs' });
  return d.svg();
}

export function be_auth_components() {
  const d = fig('be_auth_components', 'EVERY AUTHENTICATION PIECE AND ITS ONE JOB', 340);
  const c = [['password hash', 'make a stolen table useless'], ['rate limits + MFA', 'make guessing useless'], ['session', 'remember a login, revocably'], ['reset flow', 'recover without a backdoor'], ['access token', 'short proof for each API call'], ['refresh token', 'renew without re-login'], ['OAuth', 'let an app act for a user'], ['OIDC', 'tell the app who the user is']];
  const ic = [(x, y) => d.lock(x + 4, y, 26, { stroke: C.acc }), (x, y) => hourglass(d, x + 16, y, 30, { level: 0.5 }), (x, y) => tag(d, x + 12, y + 2, 26, ''), (x, y) => d.envelope(x, y + 4, 34, 22, {}), (x, y) => d.key(x, y + 14, 34, {}), (x, y) => d.key(x, y + 14, 34, { fill: C.paper }), (x, y) => d.phone(x + 8, y - 2, 34), (x, y) => d.person(x + 16, y, 30)];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 72; d.rect(x, y, 290, 58, { r: 7, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.line }); ic[i](x + 12, y + 14); d.text(x + 64, y + 20, t, { cls: 'ttl', a: 'start' }); d.text(x + 64, y + 40, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

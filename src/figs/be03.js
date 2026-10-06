import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser } from '../lib/be-kit.js';

const PARTS = ['Session authentication', 'Logout, devices and revocation', 'Password storage', 'Login attacks and defences', 'Password reset', 'JSON Web Tokens', 'Access and refresh tokens', 'JWT attacks and mistakes', 'OAuth 2.0', 'OpenID Connect and the full login'];
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
  const d = fig('be_auth_session_record', 'WHAT A SESSION RECORD HOLDS: ABOUT 200 BYTES PER ACTIVE SESSION', 280);
  card(d, 20, 50, 320, ['key: sess:<sha256 of sid>', 'user_id: 42', 'created_at: 10:00:00', 'last_seen: 10:12:40', 'absolute_exp: 22:00:00', 'device: iPhone, Wren 5.2', 'auth_level: password+otp'], { hot: [0], lh: 26 });
  d.text(480, 100, 'store a hash of the id, so a\nleaked store cannot be replayed', { cls: 'xs', vc: true });
  d.text(480, 180, '200,000 active sessions\nx 200 B = 40,000,000 B', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function be_auth_expiry() {
  const d = fig('be_auth_expiry', 'IDLE, SLIDING AND ABSOLUTE EXPIRY ON ONE TIMELINE', 300);
  const X = (m) => 120 + m * 0.65;
  d.arrow(110, 250, 620, 250, { stroke: C.gray }); [0, 120, 240, 360, 480, 600, 720].forEach((m) => d.mono(X(m), 266, `${m / 60} h`, { size: 9 }));
  d.text(110, 70, 'activity', { cls: 'sm', a: 'end' }); [0, 10, 25, 50, 300, 320].forEach((m) => d.dot(X(m), 70, 3.5, C.ink));
  d.text(110, 120, 'idle 30 min', { cls: 'sm', a: 'end' }); d.rect(X(0), 108, X(80) - X(0), 22, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X(80) + 6, 119, 'expired at 80 min', { cls: 'xs', a: 'start' });
  d.text(110, 170, 'sliding', { cls: 'sm', a: 'end' }); d.rect(X(0), 158, X(80) - X(0), 22, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(X(80) + 6, 169, 'each request pushes the end 30 min out', { cls: 'xs', a: 'start' });
  d.text(110, 215, 'absolute 12 h', { cls: 'sm', a: 'end' }); d.rect(X(0), 203, X(720) - X(0), 22, { r: 3, fill: C.paper, stroke: C.ink2, dash: [4, 3] });
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
  const d = fig('be_auth_rotation', 'ROTATE THE ID WHENEVER PRIVILEGE CHANGES: LOGIN, MFA, ROLE CHANGE', 250);
  steps(d, [['sid AAA', 'anonymous'], ['login succeeds', 'delete AAA'], ['sid 8f2c', 'user 42'], ['step-up MFA', 'new sid 3c9d']], 80, 2);
  d.text(320, 190, 'a planted or leaked pre-login id becomes worthless the moment the user logs in', { cls: 'xs' });
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
  const d = fig('be_auth_logout', 'LOGOUT DELETES THE SERVER RECORD; CLEARING THE COOKIE ALONE IS NOT ENOUGH', 300);
  panel(d, 20, 40, 290, 230, 'logout this device', true);
  d.mono(165, 90, 'DEL sess:8f2c', { size: 11, color: C.acc }); d.mono(165, 115, 'Set-Cookie: sid=; Max-Age=0', { size: 9.5 });
  d.text(165, 170, 'a copied 8f2c is now dead too', { cls: 'xs' });
  panel(d, 330, 40, 290, 230, 'log out everywhere');
  d.mono(475, 90, 'users.session_version: 7 -> 8', { size: 9.5 });
  d.text(475, 140, 'every session stores the version\nit was created with; 7 != 8 means\ninvalid on next lookup', { cls: 'xs', vc: true });
  d.text(475, 220, 'or delete all sess:* for user 42\nvia a per-user index set', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_auth_devices() {
  const d = fig('be_auth_devices', 'A DEVICE LIST IS JUST THE USER\'S SESSIONS, LABELLED', 300);
  browser(d, 120, 40, 400, 230, 'https://app.wren.example/settings/sessions');
  [['iPhone, Wren 5.2', 'Pune, active now', true], ['Chrome on Windows', 'Mumbai, 2 days ago', false], ['Firefox on Linux', 'Berlin, 5 min ago', false]].forEach(([a, b, cur], i) => { const y = 80 + i * 56; d.rect(140, y, 360, 44, { r: 6, fill: cur ? C.accFaint : C.card, stroke: cur ? C.acc : C.ink2 }); d.text(156, y + 15, a, { cls: 'ttl', size: 11, a: 'start' }); d.text(156, y + 32, b, { cls: 'xs', a: 'start' }); d.box(420, y + 10, 66, 24, cur ? 'this one' : 'revoke', { r: 5, size: 10, fill: cur ? C.accSoft : C.paper, stroke: cur ? C.acc : C.ink2 }); });
  return d.svg();
}

export function be_auth_concurrent() {
  const d = fig('be_auth_concurrent', 'A LIMIT OF 3 CONCURRENT SESSIONS: THE FOURTH LOGIN EVICTS THE OLDEST', 240);
  ['mon', 'tue', 'wed'].forEach((s, i) => { d.rect(60 + i * 110, 90, 90, 50, { r: 6, fill: i === 0 ? C.paper : C.card, stroke: i === 0 ? C.acc : C.ink2, dash: i === 0 ? [4, 3] : undefined }); d.text(105 + i * 110, 115, `session ${s}`, { cls: 'sm' }); });
  cross(d, 105, 115, 10);
  d.arrow(400, 115, 360, 115, { stroke: C.acc }); d.rect(410, 90, 110, 50, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(465, 115, 'new: thu', { cls: 'sm', color: C.acc });
  d.text(320, 200, 'per-user sorted set of session ids by creation time; evict with one range delete', { cls: 'xs' });
  return d.svg();
}

export function be_pw_fast_hash() {
  const d = fig('be_pw_fast_hash', 'CRACKING EVERY 8-CHARACTER LOWERCASE-AND-DIGIT PASSWORD (36^8 = 2.82 x 10^12)', 240);
  hbars(d, [['SHA-256 at 10^10/s', 282, '282 seconds'], ['bcrypt at 10^4/s', 282110990, '8.9 years', true]], { y: 70, gap: 60, w: 330 });
  d.text(320, 210, 'illustrative single-GPU rates; the ratio, not the exact numbers, is the point', { cls: 'xs' });
  return d.svg();
}

export function be_pw_rainbow() {
  const d = fig('be_pw_rainbow', 'WITHOUT A SALT, ONE PRECOMPUTED TABLE CRACKS EVERY USER AT ONCE', 280);
  card(d, 20, 50, 250, ['sha256(pw)  ->  pw', '5e8848...  ->  password', 'ef92b7...  ->  123456', '65e84b...  ->  qwerty'], { title: 'precomputed once' });
  card(d, 370, 50, 250, ['user 42: 5e8848...', 'user 43: 5e8848...', 'user 44: ef92b7...'], { title: 'leaked table', hot: [0, 1] });
  d.arrow(276, 100, 364, 100, { stroke: C.acc });
  d.text(320, 220, 'identical passwords also share hashes, so one crack exposes them all', { cls: 'xs' });
  return d.svg();
}

export function be_pw_salt() {
  const d = fig('be_pw_salt', 'A RANDOM PER-USER SALT MAKES THE SAME PASSWORD HASH DIFFERENTLY', 260);
  card(d, 20, 60, 290, ['user 42', 'salt: 9f1c...', 'hash(salt + "hunter2") = a7d0...'], { hot: [2] });
  card(d, 330, 60, 290, ['user 43', 'salt: 0b3e...', 'hash(salt + "hunter2") = 41c9...'], { hot: [2] });
  d.text(320, 190, 'salts are stored in the clear next to the hash; their job is uniqueness, not secrecy', { cls: 'xs' });
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
  const d = fig('be_pw_kdfs', 'THREE PASSWORD HASHES: WHAT EACH ONE MAKES EXPENSIVE', 290);
  [['bcrypt (1999)', 'CPU time', 'cost 12 = 2^12 rounds;\n72-byte input limit', false], ['scrypt (2009)', 'CPU + memory', 'N, r, p parameters;\nhurts GPU parallelism', false], ['Argon2id (2015)', 'CPU + memory\n+ lanes', 'm=19 MiB, t=2, p=1\n(OWASP minimum)', true]].forEach(([t, k, s, hot], i) => {
    const x = 20 + i * 205;
    panel(d, x, 40, 190, 220, t, hot);
    d.text(x + 95, 100, k, { cls: 'sm', vc: true, color: hot ? C.acc : undefined });
    d.text(x + 95, 180, s, { cls: 'xs', vc: true });
  });
  return d.svg();
}

export function be_pw_work_factor() {
  const d = fig('be_pw_work_factor', 'EACH +1 ON THE BCRYPT COST DOUBLES THE WORK, FOR YOU AND FOR THE ATTACKER', 280);
  hbars(d, [['cost 10', 62.5, '62.5 ms'], ['cost 11', 125, '125 ms'], ['cost 12', 250, '250 ms', true], ['cost 13', 500, '500 ms']], { y: 56, gap: 44, w: 320 });
  d.text(320, 250, 'illustrative times; at 20 logins/s, cost 12 needs 5 cores just for hashing', { cls: 'xs' });
  return d.svg();
}

export function be_pw_record() {
  const d = fig('be_pw_record', 'THE STORED STRING CARRIES ITS OWN ALGORITHM AND PARAMETERS', 220);
  d.chips(20, 80, ['$argon2id', '$v=19', '$m=19456,t=2,p=1', '$<salt>', '$<hash>'], { h: 32, size: 10.5, fill: (i) => (i === 2 ? C.accSoft : C.card), stroke: (i) => (i === 2 ? C.acc : C.ink2) });
  d.text(320, 150, 'raise m or t later: re-hash each user at their next successful login', { cls: 'xs' });
  return d.svg();
}

export function be_pw_timing() {
  const d = fig('be_pw_timing', 'AN EARLY-EXIT COMPARE TAKES LONGER THE MORE LEADING BYTES MATCH', 280);
  [['b7..', 1], ['a3..', 2], ['a9f1..', 4]].forEach(([g, n], i) => { const y = 60 + i * 50; d.mono(80, y + 12, g, { size: 11 }); d.rect(140, y, n * 70, 24, { r: 3, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(150 + n * 70, y + 12, `${n} byte${n > 1 ? 's' : ''} compared`, { cls: 'xs', a: 'start' }); });
  d.text(320, 230, 'hmac.compare_digest and crypto.timingSafeEqual always compare every byte', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_pw_enumeration() {
  const d = fig('be_pw_enumeration', 'USER ENUMERATION: DIFFERENT TIMING OR TEXT REVEALS WHICH EMAILS EXIST', 280);
  hbars(d, [['unknown email', 3, '3 ms, "no such user"'], ['known email, wrong pw', 250, '250 ms, "wrong password"', true]], { y: 70, gap: 60, w: 280 });
  d.text(320, 220, 'fix: hash a dummy password for unknown users and return one generic message', { cls: 'xs' });
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
  const d = fig('be_pw_limits', 'LAYERED LOGIN DEFENCES: EACH LIMIT CATCHES A DIFFERENT ATTACK SHAPE', 320);
  const rows = [['per account', '5 failures / min', 'brute force on one user', false], ['per IP', '20 / min', 'one noisy machine', false], ['global failure rate', 'alert on spike', 'stuffing from a botnet', true], ['breached-password check', 'at signup and login', 'reused passwords', false], ['MFA', 'second factor', 'everything above', false]];
  rows.forEach(([a, b, c, hot], i) => { const y = 50 + i * 50; d.rect(30, y, 170, 36, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(115, y + 18, a, { cls: 'ttl', size: 11 }); d.mono(300, y + 18, b, { size: 10 }); d.text(470, y + 18, c, { cls: 'sm', a: 'start' }); });
  d.text(320, 304, 'hard lockout lets anyone lock any user out; prefer delays, CAPTCHA and step-up', { cls: 'xs' });
  return d.svg();
}

export function be_pw_reset_flow() {
  const d = fig('be_pw_reset_flow', 'A SAFE PASSWORD RESET IN EIGHT STEPS', 300);
  const s = [['request', 'same reply always'], ['random token', '32 bytes'], ['store hash', 'sha256(token)'], ['expiry', '30 min'], ['email link', 'canonical host'], ['validate', 'hash, expiry, unused'], ['set password', 'hash it'], ['invalidate', 'token + sessions']];
  s.forEach(([a, b], i) => { const r = Math.floor(i / 4), c = r ? 3 - (i % 4) : i % 4, x = 24 + c * 152, y = 60 + r * 120; const hot = i === 2; d.rect(x, y, 132, 60, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 66, y + 22, a, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x + 66, y + 42, b, { cls: 'xs' }); if (i % 4 < 3) d.arrow(r ? x - 4 : x + 136, y + 30, r ? x - 16 : x + 148, y + 30, { stroke: C.gray, hl: 5 }); if (i === 3) d.arrow(x + 66, y + 64, x + 66, y + 116, { stroke: C.gray, hl: 5 }); });
  return d.svg();
}

export function be_pw_reset_bugs() {
  const d = fig('be_pw_reset_bugs', 'FOUR WAYS RESET FLOWS LEAK ACCOUNTS', 300);
  [['Host header poisoning', 'link built from Host:\nevil.example/reset?t=...'], ['token leaks', 'token in URL hits logs\nand third-party Referer'], ['no expiry or reuse', 'old email in a breached\ninbox still works'], ['sessions survive', 'attacker stays logged\nin after the reset']].forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 120; d.rect(x, y, 290, 100, { r: 8, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.line }); d.text(x + 14, y + 22, t, { cls: 'ttl', a: 'start' }); d.text(x + 14, y + 62, s, { cls: 'sm', a: 'start', vc: true }); });
  return d.svg();
}

export function be_jwt_anatomy() {
  const d = fig('be_jwt_anatomy', 'A JWT IS THREE BASE64URL PARTS JOINED BY DOTS: 560 CHARACTERS FOR WREN', 260);
  d.chips(20, 70, ['eyJhbGciOiJSUzI1NiIs...', '.', 'eyJpc3MiOiJodHRwczov...', '.', 'Kx9cQ2...(342 chars)'], { h: 32, size: 10, fill: (i) => (i === 4 ? C.accSoft : i === 2 ? C.slateSoft : C.card), stroke: (i) => (i === 4 ? C.acc : C.ink2) });
  d.text(100, 125, 'header: alg, typ, kid', { cls: 'sm' }); d.text(300, 125, 'payload: claims', { cls: 'sm' }); d.text(520, 125, 'signature', { cls: 'sm', color: C.acc });
  d.text(320, 180, 'header and payload are encoded, not encrypted: anyone can read them', { cls: 'xs' });
  d.text(320, 202, 'the signature covers base64url(header) + "." + base64url(payload)', { cls: 'xs' });
  return d.svg();
}

export function be_jwt_claims() {
  const d = fig('be_jwt_claims', 'THE REGISTERED CLAIMS IN WREN\'S ACCESS TOKEN', 300);
  card(d, 20, 50, 330, ['{', '  "iss": "https://auth.wren.example",', '  "sub": "42",', '  "aud": "api.wren.example",', '  "iat": 1791366300,', '  "exp": 1791367200,', '  "jti": "a1b2",', '  "scope": "orders:read"', '}'], { lh: 23, bold: false, hot: [3, 5] });
  ['who issued it', 'whom it is about', 'who must accept it', 'issued at', 'expires: iat + 900 s', 'unique id, for revocation', 'what it allows'].forEach((s, i) => d.text(370, 96 + i * 23, s, { cls: 'xs', a: 'start', color: [2, 4].includes(i) ? C.acc : undefined }));
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
  const d = fig('be_jwt_verify_steps', 'VERIFY IN THIS ORDER, AND TRUST NOTHING IN THE PAYLOAD UNTIL STEP 3 PASSES', 260);
  steps(d, [['parse', 'three parts'], ['pick key', 'kid, fixed alg'], ['check signature', 'reject on fail'], ['check claims', 'iss, aud, exp, nbf'], ['use sub, scope', 'now trusted']], 80, 2);
  d.text(320, 190, 'the algorithm comes from your configuration, never from the token header', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_jwt_jwks() {
  const d = fig('be_jwt_jwks', 'KEY ROTATION WITH JWKS: PUBLISH THE NEW KEY BEFORE SIGNING WITH IT', 300);
  card(d, 20, 50, 290, ['GET /.well-known/jwks.json', '{"keys":[', ' {"kid":"2026-09", ...},', ' {"kid":"2026-10", ...}]}'], { hot: [3] });
  const X = (t) => 340 + t * 26;
  d.text(480, 60, 'timeline (days)', { cls: 'xs' });
  [['kid 2026-09 signs', 0, 4, false], ['kid 2026-09 verifies', 0, 7, false], ['kid 2026-10 published', 2, 10, false], ['kid 2026-10 signs', 4, 10, true]].forEach(([s, a, b, hot], i) => { const y = 80 + i * 40; d.rect(X(a), y, X(b) - X(a), 22, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(X(a) + 4, y + 34, s, { cls: 'xs', a: 'start' }); });
  d.text(320, 270, 'old key stays published until every token it signed has expired', { cls: 'xs' });
  return d.svg();
}

export function be_jwt_vs_opaque() {
  const d = fig('be_jwt_vs_opaque', 'SELF-CONTAINED JWT VERSUS OPAQUE TOKEN WITH A LOOKUP', 300);
  panel(d, 20, 40, 290, 230, 'JWT', true);
  d.text(165, 90, 'verify signature locally', { cls: 'sm' }); d.text(165, 115, 'no network call per request', { cls: 'sm', color: C.acc });
  d.text(165, 170, 'cannot be revoked before exp\nwithout extra state', { cls: 'xs', vc: true });
  panel(d, 330, 40, 290, 230, 'opaque token');
  d.text(475, 90, 'look up in the token store', { cls: 'sm' }); d.text(475, 115, 'one store call per request', { cls: 'sm' });
  d.text(475, 170, 'revoked instantly by deleting\nthe row', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tok_access_refresh() {
  const d = fig('be_tok_access_refresh', 'SHORT ACCESS TOKENS RENEWED BY A LONG-LIVED REFRESH TOKEN', 280);
  const X = (m) => 80 + m * 8;
  d.arrow(70, 200, 620, 200, { stroke: C.gray });
  [0, 15, 30, 45].forEach((m, i) => { d.rect(X(m), 120, X(m + 15) - X(m) - 4, 30, { r: 3, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.text(X(m) + 58, 135, `access ${i + 1}`, { cls: 'xs' }); d.mono(X(m), 216, `${m}m`, { size: 9 }); });
  d.rect(X(0), 70, X(65) - X(0), 26, { r: 3, fill: C.paper, stroke: C.ink2, dash: [4, 3] }); d.text(X(0) + 8, 83, 'refresh token, 30 days', { cls: 'xs', a: 'start' });
  d.text(320, 250, 'a stolen access token is useful for at most 15 minutes', { cls: 'xs' });
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
  const d = fig('be_tok_storage', 'WHERE A BROWSER APP KEEPS TOKENS, AND WHAT EACH PLACE IS EXPOSED TO', 280);
  const rows = [['localStorage', 'any XSS reads it', 'no CSRF', false], ['JS memory', 'XSS during the session', 'lost on reload', false], ['HttpOnly cookie', 'XSS cannot read it', 'needs CSRF defence', true], ['BFF (server holds tokens)', 'browser holds a session only', 'extra hop', false]];
  rows.forEach(([a, b, c, hot], i) => { const y = 52 + i * 52; d.rect(30, y, 180, 36, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(120, y + 18, a, { cls: 'ttl', size: 11 }); d.text(240, y + 18, b, { cls: 'sm', a: 'start' }); d.text(450, y + 18, c, { cls: 'sm', a: 'start' }); });
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
  const d = fig('be_jwt_checks', 'A VALID SIGNATURE IS NOT A VALID TOKEN: FOUR CLAIM CHECKS AFTER IT', 300);
  [['iss', 'issued by our auth server, not a test one'], ['aud', 'meant for api.wren.example, not another API'], ['exp', 'not expired (allow ~60 s clock skew)'], ['nbf', 'not used before its start time']].forEach(([c, s], i) => { const y = 56 + i * 50; d.chips(60, y, [c], { h: 30, size: 12, fill: C.accSoft, stroke: C.acc, width: 60 }); d.text(150, y + 15, s, { cls: 'sm', a: 'start' }); });
  d.text(320, 270, 'a token minted for the analytics API must not open the payments API', { cls: 'xs' });
  return d.svg();
}

export function be_jwt_leak() {
  const d = fig('be_jwt_leak', 'ANYONE WHO SEES A JWT CAN DECODE ITS PAYLOAD; MANY PLACES SEE IT', 300);
  card(d, 20, 50, 290, ['echo eyJpc3Mi... | base64 -d', '{"sub":"42",', ' "email":"asha@...",', ' "phone":"+91..."}'], { hot: [2, 3] });
  [['URL query strings', 'proxy and access logs'], ['Referer header', 'third-party sites'], ['error trackers', 'request dumps'], ['browser history', 'shared devices']].forEach(([a, b], i) => { d.text(360, 70 + i * 46, a, { cls: 'ttl', size: 11, a: 'start' }); d.text(360, 88 + i * 46, b, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_oauth_actors() {
  const d = fig('be_oauth_actors', 'OAUTH 2.0 HAS FOUR ROLES', 300);
  [['resource owner', 'user 42', 100, 80], ['client', 'Wren app', 540, 80], ['authorization server', 'accounts.google.com', 100, 210], ['resource server', 'Google Calendar API', 540, 210]].forEach(([a, b, x, y], i) => { d.rect(x - 85, y - 30, 170, 60, { r: 8, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(x, y - 8, a, { cls: 'ttl', size: 11 }); d.text(x, y + 12, b, { cls: 'xs' }); });
  d.arrow(190, 80, 450, 80, { stroke: C.gray }); d.text(320, 68, 'approves access', { cls: 'xs' });
  d.arrow(190, 210, 450, 120, { stroke: C.acc }); d.text(330, 150, 'issues access token', { cls: 'xs', color: C.acc });
  d.arrow(540, 115, 540, 175, { stroke: C.gray }); d.text(560, 145, 'calls with token', { cls: 'xs', a: 'start' });
  d.text(320, 280, 'OAuth answers "may this app act for this user?", not "who is this user?"', { cls: 'xs' });
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
  const d = fig('be_oauth_pkce', 'PKCE: ONLY THE PARTY THAT STARTED THE FLOW CAN FINISH IT', 300);
  card(d, 20, 60, 280, ['code_verifier = random 43..128 chars', 'code_challenge =', '  base64url(sha256(verifier))'], { hot: [0] });
  d.arrow(310, 100, 380, 100, { stroke: C.gray }); d.text(345, 88, '/authorize', { cls: 'xs' });
  d.rect(390, 70, 220, 60, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(500, 100, 'stores challenge with code', { cls: 'sm' });
  d.arrow(310, 190, 380, 190, { stroke: C.acc }); d.text(345, 178, '/token', { cls: 'xs' });
  d.rect(390, 160, 220, 60, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(500, 190, 'sha256(verifier) == challenge?', { cls: 'sm', color: C.acc });
  d.text(160, 190, 'sends the verifier', { cls: 'sm' });
  d.text(320, 262, 'an intercepted code is useless without the verifier, which never left the client', { cls: 'xs' });
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
  const d = fig('be_oauth_redirect_attack', 'A LOOSE REDIRECT URI SENDS THE CODE TO THE ATTACKER', 300);
  card(d, 20, 50, 380, ['/authorize?client_id=wren', '&redirect_uri=https://app.wren.example', '  .evil.example/cb', '&response_type=code'], { hot: [1, 2] });
  d.rect(430, 50, 190, 90, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(525, 75, 'auth server check:', { cls: 'sm' }); d.mono(525, 100, 'startswith(registered)', { size: 9.5, color: C.acc }); d.text(525, 122, 'passes', { cls: 'sm', color: C.acc });
  d.arrow(525, 144, 525, 190, { stroke: C.acc }); d.mono(525, 206, 'code -> evil.example', { size: 10, color: C.acc });
  d.text(320, 260, 'fix: exact string match on pre-registered redirect URIs, plus PKCE', { cls: 'xs' });
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
  const d = fig('be_oidc_id_token', 'OIDC ADDS AN ID TOKEN: A SIGNED STATEMENT ABOUT THE LOGIN, FOR THE CLIENT', 300);
  panel(d, 20, 40, 290, 230, 'access token (OAuth)');
  d.text(165, 90, 'audience: the resource API', { cls: 'sm' }); d.text(165, 115, 'says what the app may do', { cls: 'sm' });
  d.text(165, 170, 'the client should treat it\nas opaque', { cls: 'xs', vc: true });
  panel(d, 330, 40, 290, 230, 'ID token (OIDC)', true);
  card(d, 350, 80, 250, ['iss: https://accounts.google.com', 'sub: 1043...', 'aud: <wren client_id>', 'nonce: n-7f3', 'email, auth_time'], { hot: [2, 3], size: 9 });
  return d.svg();
}

export function be_oidc_nonce() {
  const d = fig('be_oidc_nonce', 'THE NONCE TIES AN ID TOKEN TO THE LOGIN THAT ASKED FOR IT', 240);
  steps(d, [['generate nonce', 'store in session'], ['send in /authorize', 'nonce=n-7f3'], ['ID token returns', 'nonce: n-7f3'], ['compare', 'reject replays']], 80, 3);
  return d.svg();
}

export function be_oauth_checklist() {
  const d = fig('be_oauth_checklist', 'AN OAUTH CLIENT CHECKLIST', 330);
  ['authorization code flow + PKCE, even for confidential clients', 'exact redirect URI match, registered in advance', 'state bound to the session; nonce in OIDC', 'client secret only on servers; rotate it; never in mobile apps', 'validate ID token: signature, iss, aud, exp, nonce', 'tokens never in URLs; no implicit flow', 'request the smallest scopes; handle insufficient_scope'].forEach((s, i) => { const y = 50 + i * 38; d.rect(40, y, 26, 26, { r: 4, fill: C.accSoft, stroke: C.acc }); tick(d, 53, y + 13, 6); d.text(80, y + 13, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

export function be_auth_e2e() {
  const d = fig('be_auth_e2e', 'SIGN IN WITH GOOGLE ON WREN: OIDC IN, A WREN SESSION OUT', 360);
  const s = [['browser', '/login/google'], ['Wren backend', 'state, nonce, PKCE'], ['Google', 'login + consent'], ['callback', 'code + state'], ['token call', 'code + verifier'], ['validate', 'ID token claims'], ['find or create', 'user 42 by sub'], ['session', '__Host-sid cookie']];
  s.forEach(([a, b], i) => { const r = Math.floor(i / 4), c = r ? 3 - (i % 4) : i % 4, x = 24 + c * 152, y = 60 + r * 140; const hot = i === 5; d.rect(x, y, 132, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 66, y + 24, a, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(x + 66, y + 44, b, { cls: 'xs' }); if (i % 4 < 3) d.arrow(r ? x - 4 : x + 136, y + 32, r ? x - 16 : x + 148, y + 32, { stroke: C.gray, hl: 5 }); if (i === 3) d.arrow(x + 66, y + 68, x + 66, y + 136, { stroke: C.gray, hl: 5 }); });
  d.text(320, 320, 'Google proves identity once; Wren\'s own session carries it from then on', { cls: 'xs' });
  return d.svg();
}

export function be_auth_components() {
  const d = fig('be_auth_components', 'EVERY AUTHENTICATION PIECE AND ITS ONE JOB', 340);
  const c = [['password hash', 'make a stolen table useless'], ['rate limits + MFA', 'make guessing useless'], ['session', 'remember a login, revocably'], ['reset flow', 'recover without a backdoor'], ['access token', 'short proof for each API call'], ['refresh token', 'renew without re-login'], ['OAuth', 'let an app act for a user'], ['OIDC', 'tell the app who the user is']];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 72; d.rect(x, y, 290, 58, { r: 7, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.line }); d.text(x + 14, y + 20, t, { cls: 'ttl', a: 'start' }); d.text(x + 14, y + 40, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

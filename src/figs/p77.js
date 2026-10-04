import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const gate = (d, st, hotIdx, icons, note) => { st.forEach(([a, b], i) => { const x = 30 + i * 150, hot = i === hotIdx; if (icons) icons(d, i, x + 60, 92, hot); d.text(x + 60, 156, a, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined }); if (b) d.text(x + 60, 176, b, { cls: 'xs' }); if (i < st.length - 1) d.arrow(x + 104, 92, x + 146, 92, { stroke: C.gray, hl: 5 }); }); d.travel([[90, 92], [540, 92]], { dur: 5, r: 3.5 }); if (note) d.text(320, 236, note, { cls: 'xs' }); };
const seq = (d, actors, steps, top = 60, gap = 34) => { const xs = actors.map((_, i) => 80 + i * 480 / Math.max(1, actors.length - 1)); actors.forEach(([s, kind], i) => { if (kind === 'person') d.person(xs[i], top - 14, 34); else if (kind === 'laptop') d.laptop(xs[i] - 26, top - 10, 52); else if (kind === 'db') d.db(xs[i] - 28, top - 8, 56, 48); else d.server(xs[i] - 24, top - 10, 48, 50, { unit: 14 }); d.text(xs[i], top + 54, s, { cls: 'xs' }); d.line(xs[i], top + 64, xs[i], top + 76 + steps.length * gap, { stroke: C.line, dash: [3, 5], single: true }); }); steps.forEach(([a, b, s, hot], k) => { const y = top + 84 + k * gap, col = hot ? C.acc : C.ink2; if (a === b) { d.carrow([[xs[a], y - 6], [xs[a] + 40, y], [xs[a], y + 8]], { stroke: col, hl: 5 }); d.mono(xs[a] + 46, y, s, { size: 9, a: 'start', color: hot ? C.acc : undefined }); } else { d.arrow(xs[a], y, xs[b], y, { stroke: col, hl: 6 }); d.mono((xs[a] + xs[b]) / 2, y - 9, s, { size: 9, color: hot ? C.acc : undefined }); d.travel([[xs[a], y], [xs[b], y]], { dur: 8, at: [k / steps.length, (k + 0.8) / steps.length], r: 3, color: col }); } }); };
export function where_sd_security(stage=99) { return systemMap("sd_security", ["Authentication vs authorization", "Sessions and cookies", "JWT and API keys", "OAuth 2.0 and PKCE", "RBAC, ACLs, and resource policy", "Encryption and secrets", "Password hashing and signed URLs", "CORS, CSRF and abuse prevention", "Case study: securing one operation"], stage); }
export function cover_sd_security() { return systemCover("sd_security", 18, ["System", "security"], "Security", ["Authentication vs authorization", "Sessions and cookies", "JWT and API keys", "OAuth 2.0 and PKCE", "RBAC, ACLs, and resource policy", "Encryption and secrets", "Password hashing and signed URLs", "CORS, CSRF and abuse prevention", "Case study: securing one operation"]); }
export function sd_security_auth() {
  const d = illustration('sd_security_auth', 'A VALID LOGIN PROVES WHO YOU ARE, NOT THAT REPORT 41 IS YOURS', 280);
  gate(d, [['verify credential', 'signature, expiry'], ['resolve principal', 'user mira'], ['load resource', 'report 41, owner?'], ['evaluate action', 'read: allow?']], 3, (g, i, x, y, hot) => { if (i === 0) g.key(x - 16, y, 34); if (i === 1) g.person(x, y - 22, 36); if (i === 2) g.doc(x - 18, y - 26, 36, 50); if (i === 3) g.lock(x - 16, y - 22, 32, { stroke: C.acc, fill: C.accSoft }); }, 'check the requested resource, every time');
  return d.svg();
}
export function sd_security_tenant() {
  const d = illustration('sd_security_tenant', 'A REQUEST FROM TENANT 8 ASKING FOR AN OBJECT IN TENANT 7 IS DENIED', 300);
  d.rect(30, 50, 260, 200, { r: 10, stroke: C.ink2, dash: [5, 4] }); d.text(160, 68, 'tenant 8', { cls: 'ttl' });
  d.person(110, 110, 40); d.text(110, 166, 'request identity', { cls: 'xs' });
  d.rect(350, 50, 260, 200, { r: 10, stroke: C.ink2, dash: [5, 4] }); d.text(480, 68, 'tenant 7', { cls: 'ttl' });
  d.doc(450, 100, 60, 76); d.text(480, 196, 'stored object', { cls: 'xs' });
  d.arrow(140, 130, 440, 136, { stroke: C.acc }); cross(d, 320, 134, 12);
  d.text(320, 280, '8 ≠ 7 and no sharing grant: deny. Cache keys carry the tenant too', { cls: 'xs' });
  return d.svg();
}
export function sd_security_deny() {
  const d = illustration('sd_security_deny', 'NO MATCHING GRANT MEANS DENY: THE DEFAULT IS WRITTEN INTO THE CODE', 300);
  chip(d, 40, 90, 150, 'action + resource', false, 30); chip(d, 40, 140, 150, 'trusted context', false, 30);
  d.arrow(196, 120, 256, 120, { stroke: C.gray, hl: 5 });
  d.poly([[320, 70], [380, 120], [320, 170], [260, 120]], { fill: C.card, stroke: C.ink2 }); d.text(320, 120, 'grant?', { cls: 'sm' });
  d.arrow(384, 100, 470, 80, { stroke: C.ink2 }); chip(d, 476, 64, 100, 'allow', false, 30); d.text(426, 76, 'yes', { cls: 'xs' });
  d.arrow(384, 140, 470, 160, { stroke: C.acc }); chip(d, 476, 146, 100, 'deny', true, 30); d.text(426, 166, 'no / none', { cls: 'xs', color: C.acc });
  d.text(320, 240, 'audit the denial; word it so it does not reveal what exists', { cls: 'xs' });
  return d.svg();
}
export function sd_security_boundaries() {
  const d = illustration('sd_security_boundaries', 'FOUR HOPS, FOUR CONTRACTS: INTERNAL DOES NOT MEAN TRUSTED', 280);
  gate(d, [['browser', 'untrusted input'], ['edge', 'authenticates'], ['application', 'authorizes'], ['storage', 'scoped access']], 2, (g, i, x, y, hot) => { if (i === 0) g.laptop(x - 26, y - 22, 52); if (i === 1) g.router(x - 28, y - 4, 56); if (i === 2) g.server(x - 22, y - 26, 44, 52, { unit: 14, fill: C.accSoft, stroke: C.acc }); if (i === 3) g.db(x - 22, y - 24, 44, 48); }, 'identity travels on a protected, validated path between hops');
  return d.svg();
}
export function sd_security_session() {
const d=illustration('sd_security_session','AN OPAQUE COOKIE POINTS TO CURRENT SERVER-SIDE SESSION STATE',355);
  d.laptop(39,74,139);d.text(109,200,'browser',{cls:'ttl'});
  d.key(224,117,53,{stroke:C.acc});d.mono(249,162,'opaque ID',{size:10});
  d.doc(352,65,230,213,{lines:false,fill:C.card});d.text(467,88,'session record',{cls:'ttl'});
  ['token hash','subject + scope','expiry + revoked?'].forEach((s,i)=>d.mono(467,135+i*43,s,{size:12}));
  d.arrow(295,117,343,117,{stroke:C.acc});d.text(251,218,'lookup + current check',{cls:'sm'});
  d.text(320,323,'the credential identifies server state; current policy decides the effect',{cls:'sm'});return d.svg();
}
export function sd_security_cookie() {
  const d = illustration('sd_security_cookie', 'EACH COOKIE ATTRIBUTE BLOCKS A DIFFERENT THING', 320);
  const r = [['Secure', 'sent only over HTTPS', 'lock'], ['HttpOnly', 'not readable by page scripts', 'script'], ['SameSite', 'controls cross-site sending', 'site'], ['Domain / Path', 'where it is sent', 'path']];
  r.forEach(([a, t, k], i) => {
    const y = 56 + i * 60, hot = i === 1;
    chip(d, 40, y, 140, a, hot, 32);
    if (k === 'lock') d.lock(210, y + 2, 26); if (k === 'script') { d.mono(222, y + 16, '</>', { size: 12 }); cross(d, 222, y + 16, 12, C.acc); } if (k === 'site') d.laptop(200, y + 2, 44); if (k === 'path') d.mono(222, y + 16, '/app', { size: 11 });
    d.text(270, y + 16, t, { cls: 'sm', a: 'start' });
  });
  d.text(320, 300, 'HttpOnly does not stop XSS from sending requests with the cookie', { cls: 'xs' });
  return d.svg();
}
export function sd_security_rotation() {
  const d = illustration('sd_security_rotation', 'LOGIN ISSUES A NEW SESSION TOKEN B; THE PRE-LOGIN TOKEN A IS INVALIDATED', 300);
  d.rect(60, 90, 140, 70, { r: 8, fill: C.card, stroke: C.ink2 }); d.mono(130, 116, 'token A', { size: 12 }); d.text(130, 140, 'anonymous', { cls: 'xs' });
  d.during([0.5, 1], (g) => cross(g, 130, 125, 30, C.ink2));
  d.arrow(210, 125, 300, 125, { stroke: C.ink2 }); d.text(255, 110, 'login', { cls: 'xs' });
  d.rect(310, 90, 140, 70, { r: 8, fill: C.accSoft, stroke: C.acc }); d.mono(380, 116, 'token B', { size: 12, color: C.acc }); d.text(380, 140, 'Mira', { cls: 'xs' });
  d.text(320, 220, 'never attach the identity to a token an attacker may have planted', { cls: 'sm' });
  return d.svg();
}
export function sd_security_logout() {
  const d = illustration('sd_security_logout', 'LOGOUT MUST KILL THE SERVER RECORD; CLEARING THE COOKIE LEAVES A COPIED TOKEN ALIVE', 280);
  gate(d, [['logout', 'request'], ['invalidate record', 'server side'], ['clear cookie', 'browser'], ['copied token', 'now rejected']], 1, (g, i, x, y, hot) => { if (i === 0) g.person(x, y - 22, 34); if (i === 1) { g.db(x - 22, y - 24, 44, 48, { fill: C.accSoft, stroke: C.acc }); cross(g, x, y, 10); } if (i === 2) g.laptop(x - 26, y - 20, 52); if (i === 3) { g.key(x - 14, y, 30); cross(g, x, y, 10, C.ink2); } }, 'idle and absolute timeouts end sessions nobody logs out of');
  return d.svg();
}
export function sd_security_jwt() {
const d=illustration('sd_security_jwt','READABLE TOKEN PARTS ARE NOT TRUSTED UNTIL VERIFICATION AND VALIDATION',330);
  const parts=[['header',136],['payload',247],['signature',167]];let x=40;
  parts.forEach(([s,w],i)=>{d.rect(x,69,w,62,{r:0,fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});d.mono(x+w/2,100,s,{size:13});x+=w;});
  d.doc(193,190,223,97,{lines:false});d.mono(304,214,'issuer / audience');d.mono(304,240,'subject / time / purpose',{size:11});d.text(304,267,'application checks',{cls:'sm'});
  d.key(498,197,52,{stroke:C.acc});d.text(521,253,'trusted verification key',{cls:'sm',size:10});
  d.arrow(522,148,522,180,{stroke:C.acc});d.arrow(299,148,299,182,{stroke:C.ink2});
  d.text(320,311,'verify protection, validate claims, then authorize the operation',{cls:'sm'});return d.svg();
}
export function sd_security_token_checks() {
  const d = illustration('sd_security_token_checks', 'A GENUINE TOKEN CAN STILL BE FOR SOMEONE ELSE: CHECK ISSUER, AUDIENCE, PURPOSE, TIME', 280);
  gate(d, [['signature', 'trusted issuer key'], ['issuer', 'expected iss'], ['audience', 'aud = this API'], ['purpose + time', 'exp, nbf, type']], 2, (g, i, x, y, hot) => { g.doc(x - 18, y - 26, 36, 50, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); tick(g, x + 22, y + 18, 6, hot ? C.acc : C.ink2); }, 'then the API still decides what this principal may do');
  return d.svg();
}
export function sd_security_lifetime() {
  const d = illustration('sd_security_lifetime', 'REVOKED AT 1 S, A 300 S TOKEN CHECKED ONLY BY EXPIRY WORKS FOR 299 MORE SECONDS', 280);
  const X = 60, W = 520, s = W / 300;
  d.rect(X, 90, 300 * s, 34, { r: 2, fill: C.card, stroke: C.ink2 });
  d.rect(X + 1 * s, 90, 299 * s, 34, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(X + 150 * s, 107, 'still accepted after permission removed', { cls: 'xs', color: C.acc });
  d.pin(X, 86, { label: 'issued', dy: -34 }); d.pin(X + s, 86, { label: 'revoked', dy: -50, fill: C.accSoft, stroke: C.acc });
  ruler(d, X, 136, W, 300, 60, ' s');
  d.text(320, 220, 'shorter lifetimes or an online check bound this; pick deliberately', { cls: 'xs' });
  return d.svg();
}
export function sd_security_keys() {
  const d = illustration('sd_security_keys', 'AN API KEY OPENS A DOOR FOR ONE CALLER; A SIGNING KEY MINTS PASSES FOR EVERYONE', 300);
  panel(d, 20, 44, 292, 210, 'API key');
  d.key(120, 120, 50); d.server(210, 96, 50, 50, { unit: 14 });
  d.text(166, 200, 'authorizes one caller, scope it,\nrevoke it', { cls: 'xs', vc: true });
  panel(d, 328, 44, 292, 210, 'signing key', true);
  d.key(380, 110, 44, { stroke: C.acc, fill: C.accSoft });
  [0, 1, 2].forEach((k) => d.doc(460 + k * 34, 90 + k * 6, 30, 40, { lines: false }));
  d.text(474, 200, 'protects every token it issued;\nverifiers use the public half', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_security_roles() {
  const d = illustration('sd_security_roles', 'OAUTH: THE OWNER APPROVES, THE AUTH SERVER ISSUES, THE CLIENT USES, THE API ENFORCES', 320);
  const P = [['resource owner', 120, 80, 'person'], ['client app', 520, 80, 'laptop'], ['authorization server', 120, 230, 'srv'], ['resource API', 520, 230, 'db']];
  P.forEach(([s, x, y, k], i) => { if (k === 'person') d.person(x, y - 30, 40); if (k === 'laptop') d.laptop(x - 30, y - 30, 60); if (k === 'srv') d.server(x - 30, y - 34, 60, 56, { unit: 14, fill: C.accSoft, stroke: C.acc }); if (k === 'db') d.db(x - 30, y - 30, 60, 52); d.text(x, y + 36, s, { cls: 'sm' }); });
  d.arrow(170, 70, 470, 70, { stroke: C.ink2, both: true }); d.text(320, 58, 'wants access', { cls: 'xs' });
  d.arrow(120, 120, 120, 180, { stroke: C.ink2 }); d.text(130, 150, 'approves scope', { cls: 'xs', a: 'start' });
  d.arrow(170, 210, 480, 110, { stroke: C.acc }); d.text(330, 150, 'token', { cls: 'xs', color: C.acc });
  d.arrow(520, 120, 520, 184, { stroke: C.ink2 }); d.text(530, 150, 'calls', { cls: 'xs', a: 'start' });
  d.text(320, 300, 'the client never sees the owner\'s password', { cls: 'xs' });
  return d.svg();
}
export function sd_security_code() {
  const d = illustration('sd_security_code', 'THE REDIRECT CARRIES A ONE-TIME CODE; ONLY THE CODE EXCHANGE YIELDS THE ACCESS TOKEN', 330);
  seq(d, [['client', 'laptop'], ['authorization server', 'srv'], ['resource API', 'db']], [[0, 1, 'request scope'], [1, 0, 'redirect + code'], [0, 1, 'code + proof'], [1, 0, 'access token', true], [0, 2, 'permitted call']]);
  return d.svg();
}
export function sd_security_pkce() {
  const d = illustration('sd_security_pkce', 'PKCE: THE CLIENT KEEPS A SECRET VERIFIER V; ONLY V REDEEMS THE CODE', 300);
  const r = [['client creates', 'verifier V (kept)'], ['authorization', 'sends H(V); bound to code'], ['redemption', 'code + V → recompute H(V)'], ['stolen code', 'no V → fails']];
  r.forEach(([a, b], i) => {
    const y = 56 + i * 52, hot = i === 3;
    chip(d, 40, y, 150, a, hot, 30);
    d.text(210, y + 15, b, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
    if (i === 0) d.key(520, y + 15, 30); if (i === 3) cross(d, 540, y + 15, 9);
  });
  d.text(320, 280, 'H is the method the spec requires, not any hash you like', { cls: 'xs' });
  return d.svg();
}
export function sd_security_revoke_grant() {
  const d = illustration('sd_security_revoke_grant', 'REVOKING A CLIENT ENDS THE GRANT AND ITS REFRESH PATH; LIVE ACCESS TOKENS RUN OUT', 280);
  gate(d, [['user revokes', 'client X'], ['invalidate grant', 'consent record'], ['reject refresh', 'no new tokens'], ['bound access', 'expiry or check']], 2, (g, i, x, y, hot) => { if (i === 0) g.person(x, y - 22, 34); if (i === 1) { g.doc(x - 18, y - 26, 36, 50); cross(g, x, y, 10, C.ink2); } if (i === 2) { g.key(x - 14, y, 30, { stroke: C.acc }); cross(g, x, y, 10); } if (i === 3) g.clock(x, y, 40); }, null);
  return d.svg();
}
export function sd_security_rbac() {
  const d = illustration('sd_security_rbac', 'ROLES GRANT NAMED ACTIONS INSIDE ONE TENANT (ILLUSTRATIVE ROLES)', 300);
  const rows = ['viewer', 'scorer', 'moderator', 'owner'], cols = ['read score', 'edit score', 'moderate'], v = [[1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1]];
  cols.forEach((c, j) => d.text(260 + j * 110, 60, c, { cls: 'sm' }));
  rows.forEach((r, i) => { const y = 80 + i * 44; d.person(70, y, 26); d.text(100, y + 14, r, { cls: 'ttl', a: 'start', size: 12, color: r === 'scorer' ? C.acc : undefined }); v[i].forEach((on, j) => { d.rect(215 + j * 110, y, 90, 30, { r: 4, fill: on ? (r === 'scorer' && j === 1 ? C.accSoft : C.card) : C.paper, stroke: on ? (r === 'scorer' && j === 1 ? C.acc : C.ink2) : C.faint }); if (on) tick(d, 260 + j * 110, y + 15, 6, r === 'scorer' && j === 1 ? C.acc : C.ink2); }); });
  d.text(320, 274, 'moderating one organisation grants nothing in another', { cls: 'xs' });
  return d.svg();
}
export function sd_security_acl() {
  const d = illustration('sd_security_acl', 'MIRA SHARED CLIP 7 WITH THE ANALYST; CLIP 8 HAS NO SUCH GRANT', 300);
  d.doc(80, 70, 80, 100, { fill: C.accSoft, stroke: C.acc }); d.mono(120, 186, 'clip 7', { size: 10 });
  d.doc(460, 70, 80, 100); d.mono(500, 186, 'clip 8', { size: 10 });
  chip(d, 40, 210, 160, 'Mira → analyst: read', true);
  d.person(310, 100, 40); d.text(310, 156, 'analyst', { cls: 'xs' });
  d.arrow(286, 120, 166, 120, { stroke: C.acc }); tick(d, 226, 106, 6);
  d.arrow(334, 120, 454, 120, { stroke: C.gray, dash: [4, 4] }); cross(d, 394, 120, 8, C.ink2);
  d.text(320, 274, 'grants name a resource, a principal and an action; sharing is object-specific', { cls: 'xs' });
  return d.svg();
}
export function sd_security_attributes() {
  const d = illustration('sd_security_attributes', 'EDITING m7 NEEDS ALL FOUR: SAME TENANT, SCORER ROLE, ASSIGNED MATCH, EDITING OPEN', 280);
  gate(d, [['same tenant', 'trusted'], ['scorer role', 'in tenant'], ['assigned to m7', 'from DB'], ['editing open', 'match state']], 3, (g, i, x, y, hot) => { g.circle(x, y, 44, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); tick(g, x, y, 9, hot ? C.acc : C.ink2); }, 'the request cannot supply any of these attributes about itself');
  return d.svg();
}
export function sd_security_effect() {
  const d = illustration('sd_security_effect', 'ALLOWED WHEN QUEUED, REVOKED WHILE WAITING: THE WORKER RECHECKS AT THE EFFECT', 330);
  seq(d, [['requester', 'person'], ['worker', 'srv'], ['policy store', 'db']], [[0, 1, 'request, allowed then'], [2, 2, 'permission revoked'], [1, 2, 'recheck at effect'], [2, 1, 'deny now', true]]);
  return d.svg();
}
export function sd_security_tls() {
  const d = illustration('sd_security_tls', 'CHECK WHO IS ON THE OTHER END BEFORE SENDING THE CREDENTIAL OVER THE ENCRYPTED LINK', 280);
  gate(d, [['connect', 'expected host'], ['validate identity', 'chain + name'], ['derive keys', 'session protection'], ['send credential', 'now safe']], 1, (g, i, x, y, hot) => { if (i === 0) g.laptop(x - 26, y - 20, 52); if (i === 1) g.doc(x - 18, y - 26, 36, 50, { fill: C.accSoft, stroke: C.acc }); if (i === 2) g.lock(x - 16, y - 22, 32); if (i === 3) g.key(x - 14, y, 30); }, 'encryption to the wrong server protects nothing');
  return d.svg();
}
export function sd_security_at_rest() {
  const d = illustration('sd_security_at_rest', 'A STOLEN DISK SHOWS CIPHERTEXT; THE APP WITH DECRYPT RIGHTS STILL SEES PLAINTEXT', 300);
  panel(d, 20, 44, 292, 210, 'storage copy');
  d.disk(166, 120, 80); d.mono(166, 186, '9f3a…c1e0', { size: 11 });
  d.text(166, 220, 'useless without the key', { cls: 'xs' });
  panel(d, 328, 44, 292, 210, 'authorized application', true);
  d.server(380, 90, 60, 70, { unit: 15 }); d.key(460, 125, 40, { stroke: C.acc, fill: C.accSoft });
  d.mono(474, 186, '{score: 121}', { size: 11, color: C.acc });
  d.text(474, 220, 'a compromised app is a separate risk', { cls: 'xs' });
  return d.svg();
}
export function sd_security_envelope() {
const d=illustration('sd_security_envelope','ENVELOPE ENCRYPTION PROTECTS THE DATA AND ITS DATA KEY SEPARATELY',365);
  d.lock(70,81,65,{fill:C.accSoft,stroke:C.acc});d.key(71,194,59,{stroke:C.acc});d.text(99,246,'managed wrapping key',{cls:'ttl',size:11});
  d.doc(260,86,129,151,{lines:false});d.text(325,111,'wrapped',{cls:'ttl'});d.key(297,157,54);d.text(325,217,'data key',{cls:'sm'});
  d.db(492,111,106,125,{label:'ciphertext',size:11});d.lock(527,262,35);
  d.arrow(146,146,251,160,{stroke:C.acc});d.arrow(397,160,484,170,{stroke:C.ink2});
  d.text(320,321,'data-key authority and data access both need policy and audit',{cls:'sm'});return d.svg();
}
export function sd_security_secret() {
  const d = illustration('sd_security_secret', 'A SECRET HAS A LIFE: ISSUE SCOPED, FETCH BY IDENTITY, NEVER LOG, ROTATE AND REVOKE', 280);
  gate(d, [['issue', 'scoped'], ['retrieve', 'by workload id'], ['use', 'never logged'], ['rotate + revoke', 'on schedule or leak']], 3, (g, i, x, y, hot) => { if (i === 0) g.key(x - 14, y, 30); if (i === 1) g.server(x - 22, y - 24, 44, 48, { unit: 13 }); if (i === 2) g.doc(x - 18, y - 24, 36, 48); if (i === 3) g.gear(x, y, 22, { spin: 4, fill: C.accSoft, stroke: C.acc }); }, 'a hidden file is not a lifecycle');
  return d.svg();
}
export function sd_security_password() {
  const d = illustration('sd_security_password', 'VERIFY A PASSWORD WITH ITS SALT AND A DELIBERATELY SLOW HASH, THEN COMPARE IN CONSTANT TIME', 280);
  gate(d, [['submitted', 'password'], ['salt + params', 'from the record'], ['password hash', 'slow on purpose'], ['compare', 'constant time']], 2, (g, i, x, y, hot) => { if (i === 0) g.mono(x, y, '••••••', { size: 14 }); if (i === 1) g.doc(x - 18, y - 24, 36, 48); if (i === 2) g.gear(x, y, 24, { spin: 6, fill: C.accSoft, stroke: C.acc }); if (i === 3) g.mono(x, y, '= ?', { size: 14 }); }, 'the record stores its parameters so it can be upgraded later');
  return d.svg();
}
export function sd_security_hash_capacity() {
  const d = illustration('sd_security_hash_capacity', '100 MS AND 64 MiB PER CHECK: 10/S PER WORKER, 40/S AND 256 MiB FOR FOUR', 300);
  [0, 1, 2, 3].forEach((i) => { d.server(80 + i * 120, 70, 70, 80, { unit: 16, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(115 + i * 120, 166, '10/s', { size: 10 }); d.ram(85 + i * 120, 180, 60, 26); });
  d.mono(320, 234, '4 × 10 = 40 verifications/s · 4 × 64 = 256 MiB', { size: 11 });
  d.text(320, 266, 'illustrative, not recommended parameters; bound the anonymous queue', { cls: 'xs' });
  return d.svg();
}
export function sd_security_signed() {
  const d = illustration('sd_security_signed', 'THE APP CHECKS MIRA\'S RIGHT TO CLIP 7, THEN SIGNS A URL THE STORE CAN VERIFY ALONE', 330);
  seq(d, [['client', 'laptop'], ['app', 'srv'], ['object store', 'db']], [[0, 1, 'request clip 7'], [1, 1, 'check policy'], [1, 0, 'signed read URL'], [0, 2, 'present URL'], [2, 0, 'verify, serve', true]]);
  return d.svg();
}
export function sd_security_upload() {
  const d = illustration('sd_security_upload', 'AN UPLOAD GRANT LETS BYTES IN; PUBLICATION STILL WAITS FOR VERIFICATION', 280);
  gate(d, [['authorize key', 'server-chosen name'], ['limited grant', 'one PUT, size cap'], ['verify object', 'type, size, scan'], ['publish', 'metadata commit']], 2, (g, i, x, y, hot) => { if (i === 0) g.key(x - 14, y, 30); if (i === 1) g.doc(x - 18, y - 24, 36, 48); if (i === 2) g.lock(x - 16, y - 22, 32, { stroke: C.acc, fill: C.accSoft }); if (i === 3) g.db(x - 22, y - 24, 44, 48); }, 'a client-chosen filename never picks the storage path');
  return d.svg();
}
export function sd_security_cors() {
  const d = illustration('sd_security_cors', 'CORS DECIDES WHETHER A PAGE MAY READ THE RESPONSE; IT IS NOT AUTHENTICATION', 330);
  seq(d, [['other-origin page', 'laptop'], ['browser', 'srv'], ['Heron API', 'db']], [[1, 2, 'preflight (if required)'], [2, 1, 'allowed origins'], [1, 2, 'actual request'], [2, 1, 'response + policy'], [1, 0, 'expose only if allowed', true]]);
  return d.svg();
}
export function sd_security_csrf() {
  const d = illustration('sd_security_csrf', 'THE ATTACKER\'S PAGE MAKES THE VICTIM\'S BROWSER SEND THE COOKIE; THE CSRF TOKEN IS MISSING', 330);
  seq(d, [['attacker page', 'laptop'], ['victim browser', 'person'], ['Heron', 'srv']], [[0, 1, 'trigger action'], [1, 2, 'request + cookie'], [2, 2, 'check CSRF token'], [2, 1, 'reject: no token', true]]);
  return d.svg();
}
export function sd_security_xss() {
  const d = illustration('sd_security_xss', 'A TITLE CONTAINING <script> IS ESCAPED AND SHOWN AS TEXT, NEVER RUN', 280);
  d.doc(40, 80, 150, 60, { lines: false }); d.mono(115, 110, '<script>steal()</script>', { size: 8.5 });
  d.arrow(196, 110, 246, 110, { stroke: C.ink2 });
  d.rect(256, 84, 130, 52, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(321, 110, 'escape for HTML', { cls: 'sm', color: C.acc });
  d.arrow(392, 110, 442, 110, { stroke: C.ink2 });
  d.laptop(450, 76, 150); d.mono(525, 104, '&lt;script&gt;…', { size: 8.5 });
  d.text(320, 220, 'rich content needs a reviewed sanitizer and a content security policy', { cls: 'xs' });
  return d.svg();
}
export function sd_security_abuse() {
  const d = illustration('sd_security_abuse', '100/MIN EACH × 50,000 USERS = 5,000,000/MIN = 83,333.333333/S IF ALL PUSH AT ONCE', 300);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) d.person(40 + c * 24, 60 + r * 36, 20, { stroke: C.gray });
  d.text(150, 250, 'each = 1,000 users', { cls: 'xs' });
  d.arrow(290, 140, 360, 140, { stroke: C.acc, sw: 2 });
  d.server(370, 90, 90, 100, { fill: C.accSoft, stroke: C.acc });
  d.mono(530, 120, '83,333.333333/s', { size: 11, color: C.acc }); d.text(530, 146, 'admitted by\nper-user rules', { cls: 'xs', vc: true });
  d.text(320, 280, 'add a global cost budget and per-action rules', { cls: 'xs' });
  return d.svg();
}
export function sd_security_full_read() {
  const d = illustration('sd_security_full_read', 'PRIVATE DOWNLOAD: SESSION, POLICY, SIGNED CAPABILITY, VERIFY-AND-SERVE', 280);
  gate(d, [['TLS + session', 'who'], ['tenant + clip', 'may she?'], ['signed URL', 'one object, short'], ['store verifies', 'then serves']], 1, (g, i, x, y, hot) => { if (i === 0) g.lock(x - 16, y - 22, 32); if (i === 1) g.person(x, y - 22, 34, { fill: C.accSoft, stroke: C.acc }); if (i === 2) g.key(x - 14, y, 30); if (i === 3) g.db(x - 22, y - 24, 44, 48); }, 'never write the signed URL into logs');
  return d.svg();
}
export function sd_security_full_write() {
  const d = illustration('sd_security_full_write', 'A SCORER\'S WRITE PASSES PERMISSION, VERSION CHECKS, THEN COMMITS ONE EFFECT', 280);
  gate(d, [['credential + op id', 'K'], ['current policy', 'assigned?'], ['version + input', 'saw v7'], ['commit once', 'K unique']], 3, (g, i, x, y, hot) => { if (i === 0) g.key(x - 14, y, 30); if (i === 1) g.lock(x - 16, y - 22, 32); if (i === 2) g.doc(x - 18, y - 24, 36, 48); if (i === 3) g.db(x - 22, y - 24, 44, 48, { fill: C.accSoft, stroke: C.acc }); }, 'a valid credential cannot make a new operation id idempotent');
  return d.svg();
}
export function sd_security_leaked() {
  const d = illustration('sd_security_leaked', 'A KEY LEAKED IN A LOG: REVOKE AND ROTATE FIRST, THEN CHECK WHAT IT DID', 280);
  gate(d, [['identify', 'which key'], ['revoke + rotate', 'kill the old one'], ['update users', 'new key deployed'], ['review actions', 'audit trail']], 1, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 18, y - 24, 36, 48); if (i === 1) { g.key(x - 14, y, 30, { stroke: C.acc, fill: C.accSoft }); cross(g, x, y, 10); } if (i === 2) g.server(x - 22, y - 24, 44, 48, { unit: 13 }); if (i === 3) g.clock(x, y, 40); }, 'deleting the log line does not invalidate the key or its other copies');
  return d.svg();
}
export function sd_security_contract() {
  const d = illustration('sd_security_contract', 'FOUR CREDENTIALS: WHAT EACH AUTHORIZES AND HOW EACH STOPS WORKING', 320);
  const r = [['session', 'current session', 'revoke the record'], ['access JWT', 'issuer + audience', 'expiry or state check'], ['API key', 'scoped caller', 'revoke the key'], ['signed URL', 'method + object', 'expiry or policy']];
  r.forEach(([a, b, c], i) => {
    const y = 56 + i * 58, hot = i === 1;
    chip(d, 30, y, 140, a, hot, 30);
    d.text(190, y + 15, b, { cls: 'sm', a: 'start' });
    d.arrow(370, y + 15, 398, y + 15, { stroke: C.gray, hl: 5 }); d.text(408, y + 15, c, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 300, 'verify provider behaviour before promising instant revocation', { cls: 'xs' });
  return d.svg();
}
